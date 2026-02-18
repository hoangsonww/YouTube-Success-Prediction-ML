pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    choice(name: 'CLOUD_PROVIDER', choices: ['aws', 'gcp', 'azure', 'oci'], description: 'Cloud target for registry and Terraform environment.')
    choice(name: 'DEPLOY_STRATEGY', choices: ['rolling', 'canary', 'bluegreen'], description: 'Deployment strategy for Kubernetes overlay and Argo application.')
    booleanParam(name: 'RUN_TERRAFORM_APPLY', defaultValue: false, description: 'Run terraform apply after plan.')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Container image tag override. If empty, commit SHA is used.')
    string(name: 'GITOPS_BRANCH', defaultValue: 'main', description: 'Branch to push GitOps manifest updates.')
  }

  environment {
    PYTHONUNBUFFERED = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short=12 HEAD').trim()
          env.EFFECTIVE_IMAGE_TAG = params.IMAGE_TAG?.trim() ? params.IMAGE_TAG.trim() : env.GIT_SHA
        }
      }
    }

    stage('ML + API Quality Gates') {
      steps {
        sh '''
          set -euo pipefail
          python3 -m venv .venv --system-site-packages
          source .venv/bin/activate
          pip install --no-build-isolation -e '.[dev]'
          make train
          make test
        '''
      }
    }

    stage('Frontend Quality Gates') {
      steps {
        sh '''
          set -euo pipefail
          cd frontend
          npm ci
          npm run lint
          npm run build
        '''
      }
    }

    stage('Registry Login') {
      steps {
        script {
          env.REGISTRY_PREFIX = sh(
            returnStdout: true,
            script: "scripts/ci/registry_login.sh ${params.CLOUD_PROVIDER} | tail -n 1"
          ).trim()
        }
      }
    }

    stage('Build and Push Images') {
      steps {
        sh '''
          set -euo pipefail
          scripts/ci/build_and_push.sh "${REGISTRY_PREFIX}" "${EFFECTIVE_IMAGE_TAG}"
        '''
      }
    }

    stage('Update K8s Overlay Tags') {
      steps {
        sh '''
          set -euo pipefail
          API_IMAGE="${REGISTRY_PREFIX}/yts-api:${EFFECTIVE_IMAGE_TAG}"
          FRONTEND_IMAGE="${REGISTRY_PREFIX}/yts-frontend:${EFFECTIVE_IMAGE_TAG}"
          scripts/ci/update_kustomize_images.sh "${DEPLOY_STRATEGY}" "${API_IMAGE}" "${FRONTEND_IMAGE}"
          git config user.email "ci-bot@example.com"
          git config user.name "ci-bot"
          git add infra/k8s/overlays/${DEPLOY_STRATEGY}/kustomization.yaml
          if ! git diff --cached --quiet; then
            git commit -m "ci: update ${DEPLOY_STRATEGY} image tags to ${EFFECTIVE_IMAGE_TAG}"
            git push origin "HEAD:${GITOPS_BRANCH}"
          else
            echo "no overlay image updates detected"
          fi
        '''
      }
    }

    stage('Terraform Plan / Apply') {
      steps {
        sh '''
          set -euo pipefail
          scripts/ci/terraform_plan_apply.sh "${CLOUD_PROVIDER}" "${RUN_TERRAFORM_APPLY}"
        '''
      }
    }

    stage('Argo Sync') {
      steps {
        sh '''
          set -euo pipefail
          scripts/ci/argo_sync.sh "${DEPLOY_STRATEGY}"
        '''
      }
    }

    stage('Blue/Green Promotion Gate') {
      when {
        expression { params.DEPLOY_STRATEGY == 'bluegreen' }
      }
      steps {
        input message: 'Promote preview ReplicaSets for blue/green?', ok: 'Promote'
        sh '''
          set -euo pipefail
          scripts/ci/rollout_promote.sh yts-prod
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'artifacts/reports/*.json,infra/terraform/environments/**/tfplan', allowEmptyArchive: true
    }
  }
}
