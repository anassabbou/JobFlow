# 🎯 JobFlow – Job Application Tracker.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)

---

## 📖 Overview
**JobFlow** is a React and TypeScript web app for tracking job applications.  
It uses **Redux** for state management, **Firebase Firestore** for persistence, **Tailwind CSS** for styling, and **Vite** for development.  

✨ Features include **offline access**, **real-time synchronization**, and **browser notifications**.

---

## ✨ Features
- � **Manage job applications**
- 🔄 **Redux actions & reducers**
- 🔐 **User authentication**
- ☁️ **Firebase integration with offline fallback**
- 🔔 **Notification system**
- � **Core UI logic**
- 🐳 **Containerized deployment**
- ☸️ **Kubernetes ready**


---

## 🐳 Docker Support

📦 Pull from Docker Hub

```bash
docker pull abbou1/jobflow:1.0
```
▶️ Run the Container
```bash
docker run -d -p 3000:80 --name jobflow abbou1/jobflow:1.0
```

## ☸️ Kubernetes Deployment

Deploy all manifests

```Shell
kubectl apply -f k8s/
```

### 🏗️ Architecture Overview

- **deployment.yaml** → React app with ![3 Replicas](https://img.shields.io/badge/Replicas-3-blue)
- **service.yaml** → LoadBalancer service exposing ![Port 80](https://img.shields.io/badge/Port-80-green)

![Workloads Overview in Lens](/public/lens-screenshot.jpg)

---


## 📜 Scripts

| Command | Description |
|---------|-------------|
| ▶️ **`npm run dev`**     | Starts the **Vite** development server for local testing |
| 🛠 **`npm run build`**   | Runs **TypeScript type-checking** and builds the app for production |
| 🧹 **`npm run lint`**    | Executes **ESLint** on all `.ts` and `.tsx` files to ensure code quality |
| 👀 **`npm run preview`** | Previews the built app locally using Vite's preview server |
| 🐳 **`docker build`**    | Build containerized version of the application |
| ☸️ **`kubectl apply`**   | Deploy to Kubernetes cluster |

---

## 🚀 Live Demo  

👉 [**Explore JobFlow Live**](https://anassabbou.github.io/JobFlow/)  

---

## 💬 Discord Reminders

Configure **Settings → Discord Notifications** and store your webhook in a local `.env`:

```bash
VITE_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

## 🧩 Job Offer Import Extension

Use the browser extension in the `extension/` folder to capture offers from
`https://www.emploi-public.ma/fr/concours-liste` and prefill the JobFlow form.

Steps (Chrome):

1. Open **chrome://extensions**.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Visit the concours list page, open the extension, and click **Capture from page**.
5. Click **Open in JobFlow** to prefill the form.

## 📜 License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.
