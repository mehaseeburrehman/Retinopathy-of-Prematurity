# AI-Driven ROP Classifier (VGG16 + SegNet | Next.js + FastAPI + PyTorch)

## 📜 Abstract
Retinopathy of Prematurity (ROP) is a critical eye disease affecting premature infants, often leading to blindness if not diagnosed and treated promptly. Current diagnostic methods are limited by their variability in resources and expertise among ophthalmologists.  
In the case of AI-based solutions, the focus is either on disease detection on a broader scale or on specific isolated symptoms.  

To address these challenges, we developed an **AI-driven system** designed to enhance the early detection and diagnosis of ROP through a **multi-level classification approach**. This system leverages **deep-learning algorithms** to enhance fundus images using image processing techniques, detecting and classifying key retinal changes such as abnormal blood vessel growth and retinal detachment into four types: **Healthy, Type-1, Type-2, and RD**.  

This innovation aims to bridge the gap in ROP diagnosis, particularly in resource-limited settings, and support clinicians in making informed decisions — ultimately improving patient outcomes and reducing the risk of blindness in affected infants.

---

## 💡 Introduction
A **web-based AI application** for classifying retinal images to detect ROP using a **VGG16 + SegNet** deep learning model.

### 🏥 Medical Classifications
The system classifies retinal images into **4 categories**:
- **Healthy** — Normal retina condition
- **RD** — Retinal Detachment
- **Type 1** — Criticle Retinopathy of Prematurity
- **Type 2** — Mild Retinopathy of Prematurity

---

## ✨ Features
- 🤖 **AI-Powered Classification**: VGG16+SegNet model for ROP detection
- 🔐 **User Authentication**: Secure login/signup system
- 📊 **Prediction History**: Track and download predictions as CSV
- 🎨 **Modern UI**: Responsive Next.js + Tailwind design

---

## 🗂 Project Structure
```
ml-retinal-classifier/
├── .gitignore
├── app/
│   ├── admin/
│   └── ...
├── components/
├── hooks/
├── lib/
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public/
│   ├── placeholder-logo.png
│   └── ...
├── python-api/
│   ├── main.py
│   ├── requirements.txt
│   └── Vgg16+Segnet_model.pth
├── styles/
│   └── globals.css
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛠 Installation & Setup

### Prerequisites
- **Python 3.8+** — [Download](https://www.python.org/downloads/)  
- **VS Code** — [Download](https://code.visualstudio.com/) 
- **MODEL (.pth)** — [Google Drive](https://drive.google.com/file/d/12nBZuHOqeJZm_ykhC4nSzYr5wHgPV2x_/view?usp=sharing)  
- **Dataset** — [Google Drive](https://drive.google.com/file/d/1Bn37j9GG7JW9RoVzMQd_aex_dvAf2lHR/view?usp=sharing)  

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/mehaseeburrehman/Retinopathy-of-Prematurity.git
```

### 2️⃣ Open in VS Code

### 3️⃣ Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend (Python API):**
```bash
cd python-api
pip install -r requirements.txt
```
```bash
# Or create a virtual environment first (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
**Add Model File:**
- Place `Vgg16+Segnet_model.pth` in the `python-api/` folder.

---

## 🚀 Running the Application

Open **two terminals** in VS Code:

**Terminal 1 — Backend:**
```bash
cd python-api
python main.py
```
You should see:
```
Starting ROP Classifier API...
📁 Looking for model: Vgg16+Segnet_model.pth
📂 Current directory: .../python-api
✅ Model file found: Vgg16+Segnet_model.pth (101.1MB)
🔄 Loading model from Vgg16+Segnet_model.pth...
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```
- Access the application at **http://localhost:3000**

---

## 📖 How to Use

### 1. Create Account
- Click **Register** tab  
- Enter username & password 
- Click **Register**

### 2. Login
- Enter your credentials  
- Click **Login**

### 3. Make Predictions
- **Upload Image** — Click *Upload Eye Image* and select a retinal image  
- **Analyze** — Click *Analyze Image* button  
- **View Results** — Confidence percentages for each class

### 4. View History
- Go to **Prediction History** tab  
- To see past predictions  
- Click *Download CSV* to export data

---

## 🧠 Tech Stack
**Frontend**: Next.js 14, React, Tailwind CSS, Radix UI  
**Backend**: FastAPI, Uvicorn, Python 3.8+  
**AI Model**: VGG16 + SegNet, PyTorch, Torchvision  
**Database**: SQLite

---
