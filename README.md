<!-- 🛰️ Project Banner -->

<p align="center">
  <img src="https://img.shields.io/badge/Calculator_v2-%F0%9F%99%82%F0%9F%94%A5-blue?style=for-the-badge" alt="Calculator v2 Badge">
  <img src="https://img.shields.io/badge/MongoDB-%F0%9F%8D%84-green?style=for-the-badge&logo=mongodb" alt="MongoDB Badge">
</p>

# 🚀 Calculator Microservice v2 + MongoDB Integration

> A futuristic, containerized **Calculator Microservice** that persists history in **MongoDB**, deployed on **Kubernetes** with health checks and scaling.

---

## 🎨 Table of Contents

* [🖥️ Demo & Evidence](#%EF%B8%8F-demo--evidence)
* [⚙️ Features](#%EF%B8%8F-features)
* [🚀 Installation](#%EF%B8%8F-installation)
* [🛠️ Usage](#%EF%B8%8F-usage)
* [📦 Docker Setup](#%EF%B8%8F-docker-setup)
* [☸️ Kubernetes Deployment](#%E2%98%B8%EF%B8%8F-kubernetes-deployment)
* [📁 Project Structure](#%EF%B8%8F-project-structure)
* [🔍 Health Checks & Monitoring](#%EF%B8%8F-health-checks--monitoring)
* [📝 Contributing](#%EF%B8%8F-contributing)
* [📜 License](#%EF%B8%8F-license)

---

## 🖥️ Demo & Evidence

Here's evidence of the microservice in action:

**`/add` Endpoint Result:**

<img width="407" alt="6" src="https://github.com/user-attachments/assets/710689b9-6436-49b9-8d38-e8b6527d91d1" />


**`/history` Endpoint Output:**

```powershell
# Invoke-RestMethod ... /history
_id    : 6821d6ef...
op     : add
n1     : 5
n2     : 7
result : 12
ts     : ...
````

**Kubernetes Pods Running:**

<img width="349" alt="4" src="https://github.com/user-attachments/assets/dee93cff-2710-4cf2-98a3-952260e4bc8b" />


-----

## ⚙️ Features

  * **CRUD Operations** for arithmetic: `add`, `subtract`, `multiply`, `divide`, `power`, `mod`, `sqrt`.
  * **Persistent History** stored in MongoDB (`calculations` collection).
  * **Futuristic API** endpoints with JSON responses.
  * **Health Endpoints** (`/health`) for readiness and liveness probes.
  * **Scalable** via Kubernetes Deployments (3 replicas by default).
  * **Secure** credentials managed by Kubernetes Secrets.

-----

## 🚀 Installation

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/YourUsername/sit737-2025-prac6c.git
    cd sit737-2025-prac6c
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set environment variables** (optional if using Kubernetes Secrets):
    ```bash
    export MONGO_URI="mongodb://appuser:S3cur3P@ss@localhost:27017/calculator?authSource=admin"
    ```

-----

## 🛠️ Usage

1.  **Run locally**:
    ```bash
    node src/index.js
    ```
2.  **Test endpoints**:
    ```bash
    curl "http://localhost:3000/add?num1=5&num2=7"
    curl "http://localhost:3000/history"
    ```

-----

## 📦 Docker Setup

1.  **Build image**:
    ```bash
    docker build -t your-dockerhub/sit737-2025-prac6c:v3 .
    ```
2.  **Push to Docker Hub**:
    ```bash
    docker push your-dockerhub/sit737-2025-prac6c:v3
    ```

-----

## ☸️ Kubernetes Deployment

> Apply all manifests in the `k8s/` directory in order:

```bash
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
```

**Access your service**:

```bash
kubectl port-forward svc/node-app-service 3000:3000
# In another terminal:
curl http://localhost:3000/health
curl http://localhost:3000/history
curl "http://localhost:3000/add?num1=10&num2=5"
```

-----

## 📁 Project Structure

```
├── src/
│   ├── index.js        # Main server + routes
│   ├── db.js           # MongoDB connection helper
│   └── logger.js       # Winston logger config
├── k8s/                # Kubernetes manifests
├── Dockerfile          # Node.js app container
├── package.json        # npm dependencies
├── README.md           # This file
└── evidence/           # Screenshots & logs (Optional: As used in Demo section)
```

-----

## 🔍 Health Checks & Monitoring

  * **Readiness Probe (MongoDB)**: Checks MongoDB readiness using `db.adminCommand('ping')`. Starts after an initial delay of 10 seconds and runs every 10 seconds.
  * **Liveness Probe (MongoDB)**: Performs a basic TCP check on port `27017` to ensure the MongoDB process is listening.
  * **Readiness/Liveness Probe (App)**: Uses an HTTP GET request to the `/health` endpoint of the Node.js application.

*Kubernetes automatically monitors these probes and will restart containers that fail their liveness checks or stop sending traffic to containers that fail readiness checks.*

-----

## 💾 Backups & Disaster Recovery

To guard against data loss, we’ve added a daily MongoDB dump:

1. **Backup PVC** (k8s/mongodb-backup-pvc.yaml)
```bash
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

2. **CronJob** (k8s/mongodb-backup-cronjob.yaml)
```bash
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup
spec:
  schedule: "0 2 * * *"                     # Runs daily at 2 AM Melbourne time
  timeZone: "Australia/Melbourne"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mongo:6.0
            command:
              - /bin/sh
              - -c
              - |
                mongodump \
                  --uri="$MONGO_URI" \
                  --archive=/backups/backup-$(date +%F).gz \
                  --gzip
            env:
            - name: MONGO_URI
              valueFrom:
                secretKeyRef:
                  name: mongodb-secret
                  key: mongo-uri
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

3. **Restore**
```bash
# Spin up a mongo pod mounting the backup PVC and restore
kubectl run --rm -it mongo-restore --image=mongo:6.0 --overrides='{"spec":{"containers":[{"name":"mongo","image":"mongo:6.0","command":["mongorestore","--gzip","--archive=/backups/backup-<DATE>.gz"],"volumeMounts":[{"mountPath":"/backups","name":"backup-pvc"}]}],"volumes":[{"name":"backup-pvc","persistentVolumeClaim":{"claimName":"backup-pvc"}}]}}' -- bash
```
*Ensure your mongodb-secret.yaml includes the full connection URI under the mongo-uri key for backups.*

-----
## 📝 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/x`)
3.  Commit your changes (`git commit -m "feat: add X feature"`)
4.  Push to branch (`git push origin feature/x`)
5.  Open a Pull Request

**We welcome futuristic enhancements\!** 🚀

-----

## 📜 License

Distributed under the **MIT License**. See `LICENSE` file for more information.

-----

<p align="center">Made with ❤️ and ☕ by Saketh Reddy Poreddy (<a href="https://github.com/Tillu6">Tillu6</a>)</p>
