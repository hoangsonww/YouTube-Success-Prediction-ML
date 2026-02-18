data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_objectstorage_namespace" "this" {
  compartment_id = var.compartment_id
}

resource "oci_core_vcn" "this" {
  cidr_blocks    = ["10.60.0.0/16"]
  compartment_id = var.compartment_id
  display_name   = "${var.cluster_name}-vcn"
  dns_label      = "ytsvcn"
  freeform_tags  = var.tags
}

resource "oci_core_internet_gateway" "this" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.cluster_name}-igw"
  enabled        = true
  freeform_tags  = var.tags
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.cluster_name}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.this.id
  }

  freeform_tags = var.tags
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.cluster_name}-public-sl"

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "10.60.0.0/16"
    tcp_options {
      min = 1
      max = 65535
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }

  freeform_tags = var.tags
}

resource "oci_core_subnet" "public" {
  cidr_block                 = "10.60.1.0/24"
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.this.id
  display_name               = "${var.cluster_name}-public-subnet"
  dns_label                  = "publicsub"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  freeform_tags              = var.tags
}

resource "oci_containerengine_cluster" "this" {
  compartment_id     = var.compartment_id
  kubernetes_version = var.kubernetes_version
  name               = var.cluster_name
  vcn_id             = oci_core_vcn.this.id

  endpoint_config {
    is_public_ip_enabled = true
    subnet_id            = oci_core_subnet.public.id
  }

  options {
    service_lb_subnet_ids = [oci_core_subnet.public.id]

    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }
  }

  freeform_tags = var.tags
}

resource "oci_containerengine_node_pool" "this" {
  cluster_id          = oci_containerengine_cluster.this.id
  compartment_id      = var.compartment_id
  kubernetes_version  = var.kubernetes_version
  name                = "${var.cluster_name}-pool"
  node_shape          = var.node_shape

  node_shape_config {
    memory_in_gbs = var.node_memory_gb
    ocpus         = var.node_ocpus
  }

  node_config_details {
    size = 3

    placement_configs {
      availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
      subnet_id           = oci_core_subnet.public.id
    }
  }

  initial_node_labels {
    key   = "workload"
    value = "youtube-success"
  }

  freeform_tags = var.tags
}

resource "oci_artifacts_container_repository" "api" {
  compartment_id = var.compartment_id
  display_name   = "yts-api"
  is_immutable   = false
  is_public      = false
  freeform_tags  = var.tags
}

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = var.compartment_id
  display_name   = "yts-frontend"
  is_immutable   = false
  is_public      = false
  freeform_tags  = var.tags
}

resource "oci_objectstorage_bucket" "artifacts" {
  compartment_id = var.compartment_id
  namespace      = data.oci_objectstorage_namespace.this.namespace
  name           = "youtube-success-artifacts"
  storage_tier   = "Standard"
  versioning     = "Enabled"
  freeform_tags  = var.tags
}
