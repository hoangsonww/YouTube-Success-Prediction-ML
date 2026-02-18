resource "google_compute_network" "this" {
  name                    = "${var.cluster_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "this" {
  name          = "${var.cluster_name}-subnet"
  ip_cidr_range = var.subnetwork_cidr
  region        = var.region
  network       = google_compute_network.this.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.30.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.40.0.0/20"
  }
}

resource "google_container_cluster" "this" {
  name                     = var.cluster_name
  location                 = var.region
  network                  = google_compute_network.this.self_link
  subnetwork               = google_compute_subnetwork.this.self_link
  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  release_channel {
    channel = "REGULAR"
  }
}

resource "google_container_node_pool" "primary" {
  name       = "${var.cluster_name}-pool"
  location   = var.region
  cluster    = google_container_cluster.this.name
  node_count = 3

  autoscaling {
    min_node_count = 2
    max_node_count = 10
  }

  node_config {
    machine_type = var.node_machine_type
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    labels       = var.tags
  }
}

resource "google_artifact_registry_repository" "containers" {
  provider      = google
  location      = var.region
  repository_id = "youtube-success"
  description   = "Container registry for YouTube Success ML"
  format        = "DOCKER"
}

resource "google_storage_bucket" "artifacts" {
  name                        = "${var.project_id}-yts-artifacts"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  labels = var.tags
}
