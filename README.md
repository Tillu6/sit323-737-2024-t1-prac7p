# SIT737 - 2025 - Practical 6.2C: Interacting & Updating a Kubernetes Cloud-Native Application

**A practical demonstration of managing and updating a Node.js microservice deployed on Kubernetes.**

[![Docker Image](https://img.shields.io/badge/Docker-tillu018/sit737--2025--prac5p%3Av2-blue?logo=docker)](https://hub.docker.com/r/tillu018/sit737-2025-prac5p)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Managed-blueviolet?logo=kubernetes)](https://kubernetes.io/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repo-green?logo=github)](https://github.com/Tillu6/sit737-2025-prac6c)
[![GitHub issues](https://img.shields.io/github/issues/Tillu6/sit737-2025-prac6c?logo=github)](https://github.com/Tillu6/sit737-2025-prac6c/issues)
---

## Overview

Welcome to **SIT737 2025 Practical 6.2C**. This project demonstrates key skills in managing cloud-native applications using Kubernetes. We will:

1.  **Interact** with a previously deployed Kubernetes application (Calculator Microservice) using both the command-line (`kubectl`) and the Kubernetes Dashboard.
2.  **Update** the Node.js microservice code to a new version (v2), introducing new features and improved logging.
3.  **Build and Push** a new Docker image containing the updated application.
4.  **Deploy** the updated application version to Kubernetes using a rolling update strategy, ensuring zero downtime.

This practical provides hands-on experience with fundamental DevOps practices for container orchestration and application lifecycle management.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Part I: Interacting with the Deployed Application](#part-i-interacting-with-the-deployed-application)
  - [1. Verify Kubernetes Resources](#1-verify-kubernetes-resources)
  - [2. Access via Port-Forwarding](#2-access-via-port-forwarding)
  - [3. Explore with the Kubernetes Dashboard](#3-explore-with-the-kubernetes-dashboard)
- [Part II: Updating the Application](#part-ii-updating-the-application)
  - [1. Updating the Node.js Code (v2)](#1-updating-the-nodejs-code-v2)
  - [2. Building and Pushing the Docker Image (v2)](#2-building-and-pushing-the-docker-image-v2)
  - [3. Updating the Kubernetes Deployment](#3-updating-the-kubernetes-deployment)
- [Kubernetes Manifests](#kubernetes-manifests)
  - [`deployment.yaml`](#deploymentyaml)
  - [`service.yaml`](#serviceyaml)
- [Accessing the Updated Service](#accessing-the-updated-service)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Prerequisites

Ensure the following tools are installed and configured on your system:

-   **Git:** For cloning the repository. [Download Git](https://git-scm.com/downloads)
-   **Node.js:** (LTS version recommended) For running the application locally if needed. [Download Node.js](https://nodejs.org/en/download/)
-   **Docker:** For building and running containers. [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
-   **Kubernetes Cluster:**
    -   Enable Kubernetes within Docker Desktop (Recommended for local development).
    -   Alternatively, use [Minikube](https://minikube.sigs.k8s.io/docs/start/) or a cloud provider's Kubernetes service (like GKE, EKS, AKS).
-   **kubectl:** The Kubernetes command-line tool. It's usually included with Docker Desktop or can be installed separately. [Install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
-   **Visual Studio Code (Optional):** A recommended code editor. [Download VS Code](https://code.visualstudio.com/)
-   **Docker Hub Account (Optional but Recommended):** If you want to push your images to a public registry.

---

## Project Files and Structure

Here’s how the project files are organized (assuming you've followed the folder recommendations):

```markdown
sit737-2025-prac6c/
├── .gitignore          # Tells Git what to ignore (node_modules, logs, etc.)
├── kubernetes/         # Kubernetes manifest files
│   ├── dashboard-admin.yaml # (If used for dashboard setup)
│   ├── deployment.yaml    # Defines how to run the app pods
│   └── service.yaml       # Defines how to access the app
├── docs/               # Supporting documents
│   └── Report.pdf      # Your project report
├── index.js            # Main Node.js app code (v2)
├── logger.js           # Logging helper module
├── Dockerfile          # Instructions to build the Docker image
├── docker-compose.yml  # Optional: For local testing with Docker Compose
├── package.json        # Lists Node.js dependencies and scripts
├── package-lock.json   # Exact Node.js dependency versions
├── README.md           # This file!
├── node_modules/       # (Ignored by Git) Dependencies installed by npm
└── logs/               # (Ignored by Git) Application logs might go here

-----

## Part I: Interacting with the Deployed Application

*(we are taking the v1 application from a previous practical is already deployed )*

### 1\. Verify Kubernetes Resources

Check the status of your running Pods and Services:

```bash
# List running pods (ensure they are in 'Running' state)
kubectl get pods

# List services (note the CLUSTER-IP and PORT(S) for node-app-service)
kubectl get services
```

### 2\. Access via Port-Forwarding

Create a secure tunnel from your local machine to the application Pod:

```bash
# Forward local port 3000 to port 3000 on one of the deployment's pods
kubectl port-forward deployment/node-app-deployment 3000:3000
```

Open your web browser and navigate to `http://localhost:3000`. You should see the homepage of the currently deployed application (initially v1).

*(Keep this terminal running to maintain the port-forward)*

### 3\. Explore with the Kubernetes Dashboard

The Kubernetes Dashboard provides a web-based UI for managing your cluster.

```bash
# Start the kubectl proxy (listens on localhost:8001 by default)
kubectl proxy
```

Access the Dashboard using the appropriate URL. The standard URL for accessing via the proxy is:

```
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

*Notes:*

  * *Authentication:* Accessing the dashboard might require a token. Refer to Kubernetes documentation for creating a user and retrieving a token if needed.
  * *Namespace:* Ensure you select the correct namespace (e.g., `default`) in the Dashboard UI to view your application resources if they aren't in `kube-system`.

-----

## Part II: Updating the Application

### 1\. Updating the Node.js Code (v2)

The `index.js` file has been updated to version `v2`. Key changes include:

  - **Updated Homepage Message:** The root route `/` now explicitly states "v2".
  - **New `/version` Endpoint:** Returns JSON with version details: `{ "version": "v2", ... }`.
  - **Enhanced Logging:** Logs now include a `v2 |` prefix for easier identification.


### 2\. Building and Pushing the Docker Image (v2)

Navigate to the project's root directory in your terminal and build the new Docker image:

```bash
# Build the image and tag it appropriately (replace 'tillu018' if using your own Docker Hub)
docker build -t tillu018/sit737-2025-prac5p:v2 .
```

**Test Locally (Optional):**
Ensure the new image works correctly before deploying to Kubernetes.

```bash
# Run the v2 container locally (use a different host port if 3000 is busy)
docker run --rm -p 3001:3000 tillu018/sit737-2025-prac5p:v2
```

Verify in your browser:

  - `http://localhost:3001` should show the "v2" message.
  - `http://localhost:3001/version` should return the v2 JSON.
    Stop the local container (`Ctrl+C`).

**Push to Docker Hub (Required for most clusters):**
If your Kubernetes cluster doesn't have access to your local Docker daemon's images (common for cloud clusters or even Minikube sometimes), you need to push the image to a registry like Docker Hub.

```bash
# Log in to Docker Hub (if needed)
# docker login

# Push the tagged image
docker push tillu018/sit737-2025-prac5p:v2
```

### 3\. Updating the Kubernetes Deployment

We will instruct Kubernetes to perform a rolling update to the new image version.

**Method 1: Apply Updated Manifest File**

1.  **Edit `deployment.yaml`**: Change the `.spec.template.spec.containers[0].image` field to point to your new image tag: `tillu018/sit737-2025-prac5p:v2`. (See updated file below).

2.  **Apply the configuration**:

    ```bash
    kubectl apply -f deployment.yaml
    ```

**Method 2: Imperative Command**

Use `kubectl set image` to update the deployment directly:

```bash
kubectl set image deployment/node-app-deployment node-app=tillu018/sit737-2025-prac5p:v2 --record
```

*(The `--record` flag is optional but useful for tracking rollout history)*

**Monitor the Rollout:**
Watch the update process in real-time:

```bash
kubectl rollout status deployment/node-app-deployment
```

Kubernetes will gradually replace the old pods with new ones running the v2 image. Once complete, you should see "deployment "node-app-deployment" successfully rolled out".

-----

## Kubernetes Manifests

These YAML files define the desired state for our application in Kubernetes.

### `deployment.yaml`

Defines a Deployment object, which manages replica Pods. Note the `replicas: 3` for availability and the updated `image` tag.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app-deployment
  labels:
    app: node-app # Label for the Deployment itself
spec:
  replicas: 3 # Run 3 identical pods for high availability
  selector:
    matchLabels:
      app: node-app # Which pods this deployment manages
  strategy:
    type: RollingUpdate # Strategy for updates (default)
    rollingUpdate:
      maxUnavailable: 1 # Max pods unavailable during update
      maxSurge: 1       # Max extra pods created during update
  template: # Blueprint for the pods
    metadata:
      labels:
        app: node-app # Label applied to each pod
    spec:
      containers:
      - name: node-app # Container name within the pod
        image: tillu018/sit737-2025-prac5p:v2 # *** The updated Docker image ***
        ports:
        - containerPort: 3000 # Port the application listens on inside the container
        resources: # Optional: Define resource requests/limits
          requests:
            memory: "64Mi"
            cpu: "100m" # 0.1 CPU core
          limits:
            memory: "128Mi"
            cpu: "250m" # 0.25 CPU core
```

### `service.yaml`

Defines a Service object, which provides a stable IP address and DNS name to access the Pods managed by the Deployment.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: node-app-service
spec:
  selector:
    app: node-app # Selects pods with the 'app: node-app' label
  ports:
    - protocol: TCP
      port: 80        # Port the service is accessible on within the cluster
      targetPort: 3000 # Port on the pods the service forwards traffic to
  type: ClusterIP     # Exposes the service on a cluster-internal IP (default)
  # Use type: LoadBalancer for cloud providers or NodePort for direct node access
  # type: NodePort
  # ports:
  #   - protocol: TCP
  #     port: 80
  #     targetPort: 3000
  #     nodePort: 30080 # Example node port
```

*(The `service.yaml` typically doesn't need changes during a simple image update, but is included for completeness.)*

-----

## Accessing the Updated Service

After the rollout is complete, verify the update:

1.  **Using Port-Forwarding:**
    If your previous `kubectl port-forward` command is still running, stop it (`Ctrl+C`) and restart it:

    ```bash
    kubectl port-forward deployment/node-app-deployment 3000:3000
    ```

    Refresh your browser at `http://localhost:3000`. You should now see the **v2** homepage message. Navigate to `http://localhost:3000/version` to see the new version endpoint details.

2.  **Using the Kubernetes Dashboard:**
    Refresh the Dashboard view. Examine the Pods managed by the `node-app-deployment`. You should see the new Pods running the `tillu018/sit737-2025-prac5p:v2` image. You can also view the Service details.

-----

## Troubleshooting

  - **ImagePullBackOff / ErrImagePull:**
      - Verify the image tag in `deployment.yaml` or `kubectl set image` command is correct.
      - Ensure the image exists in the Docker registry (`docker pull tillu018/sit737-2025-prac5p:v2` should work).
      - If using a private registry, ensure Kubernetes has the necessary pull secrets configured.
      - Check if you pushed the image: `docker push tillu018/sit737-2025-prac5p:v2`.
  - **CrashLoopBackOff:** The container is starting and crashing repeatedly.
      - Check container logs: `kubectl logs <pod-name>` (find pod name using `kubectl get pods`).
      - Describe the pod for more details: `kubectl describe pod <pod-name>`.
      - Ensure the application code (`index.js`) is correct and dependencies (`package.json`) are installed in the Docker image.
  - **Port Conflicts:** If `kubectl port-forward` or `docker run` fails because port 3000 is busy, use a different local port: `kubectl port-forward deployment/node-app-deployment 3001:3000`. Access via `http://localhost:3001`.
  - **Rollout Stuck:**
      - Check rollout status: `kubectl rollout status deployment/node-app-deployment`
      - Describe the deployment: `kubectl describe deployment node-app-deployment`
      - Check events: `kubectl get events --sort-by='.lastTimestamp'` for cluster-wide issues.
  - **Dashboard Access Issues:** Consult Kubernetes documentation for dashboard authentication specific to your cluster setup (token, kubeconfig, etc.).

-----

## Acknowledgements

  - **Deakin University SIT737 Teaching Team:** For providing the practical exercise framework and guidance.
  - **Contributors:** To the powerful open-source projects used: Kubernetes, Docker, Node.js, Express.js.
  - **Author:** Tillu (Tillu6)

-----

*This practical demonstrates a core DevOps workflow for updating applications in Kubernetes. Happy Cloud Computing\!*
