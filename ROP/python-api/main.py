from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io
import uvicorn
import os
import numpy as np
import sys

app = FastAPI(title="ROP Classifier API")

# Enable CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROPNet Model Definition
class ROPNet(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        vgg = models.vgg16(pretrained=False)
        self.encoder = vgg.features
        self.decoder = nn.Sequential(
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.Conv2d(512, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.Conv2d(256, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.Conv2d(128, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True)
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(64, 256), nn.ReLU(inplace=True), nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.decoder(x)
        return self.classifier(x)

# Model Handler - MANDATORY MODEL LOADING
class ModelHandler:
    def __init__(self, model_path="Vgg16+Segnet_model.pth"):
        self.model_path = model_path
        self.model = None
        self.classes = ['Healthy', 'Retinal Detachment', 'Type-1', 'Type-2']
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Image preprocessing - MUST match your training setup
        self.transform = transforms.Compose([
            transforms.Resize((244, 244)),
            transforms.ToTensor(),
            transforms.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5))
        ])
    
    def verify_model_file(self):
        """Verify model file exists and is valid"""
        if not os.path.exists(self.model_path):
            print(f"❌ ERROR: Model file not found at '{self.model_path}'")
            print(f"📂 Current directory: {os.getcwd()}")
            print(f"📁 Available files: {os.listdir('.')}")
            print("\n🔧 SOLUTION:")
            print(f"   1. Place your trained model file as: {self.model_path}")
            print(f"   2. Or update model_path in ModelHandler.__init__()")
            return False
        
        # Check file size (should be reasonable for a trained model)
        file_size = os.path.getsize(self.model_path) / (1024 * 1024)  # MB
        if file_size < 1:
            print(f"⚠️  WARNING: Model file is very small ({file_size:.1f}MB)")
            print("   This might not be a valid trained model")
        
        print(f"✅ Model file found: {self.model_path} ({file_size:.1f}MB)")
        return True
    
    def load_model(self):
        """Load and verify the model - MANDATORY"""
        if not self.verify_model_file():
            raise FileNotFoundError(f"Model file '{self.model_path}' not found or invalid")
        
        try:
            print(f"🔄 Loading model from {self.model_path}...")
            
            # Create model architecture
            self.model = ROPNet(num_classes=len(self.classes)).to(self.device)
            
            # Load trained weights
            checkpoint = torch.load(self.model_path, map_location=self.device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['model_state_dict'])
                    print("📊 Loaded from checkpoint with model_state_dict")
                elif 'state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['state_dict'])
                    print("📊 Loaded from checkpoint with state_dict")
                else:
                    self.model.load_state_dict(checkpoint)
                    print("📊 Loaded from checkpoint dict")
            else:
                self.model.load_state_dict(checkpoint)
                print("📊 Loaded from state dict")
            
            # Set to evaluation mode
            self.model.eval()
            
            # Verify model is working with a test tensor
            self.verify_model_functionality()
            
            print(f"✅ Model loaded successfully!")
            print(f"🔧 Device: {self.device}")
            print(f"📊 Classes: {self.classes}")
            print(f"🎯 Input size: 244x244")
            
        except Exception as e:
            print(f"❌ ERROR loading model: {str(e)}")
            print("\n🔧 POSSIBLE SOLUTIONS:")
            print("   1. Check if model architecture matches your trained model")
            print("   2. Verify the model was saved correctly")
            print("   3. Check if you need to modify the ROPNet class")
            print("   4. Ensure PyTorch versions are compatible")
            raise RuntimeError(f"Failed to load model: {e}")
    
    def verify_model_functionality(self):
        """Test model with dummy input to ensure it works"""
        try:
            # Create dummy input
            dummy_input = torch.randn(1, 3, 244, 244).to(self.device)
            
            with torch.no_grad():
                output = self.model(dummy_input)
            
            # Check output shape
            expected_shape = (1, len(self.classes))
            if output.shape != expected_shape:
                raise ValueError(f"Model output shape {output.shape} != expected {expected_shape}")
            
            print(f"✅ Model functionality verified - output shape: {output.shape}")
            
        except Exception as e:
            raise RuntimeError(f"Model functionality test failed: {e}")
    
    def preprocess_image(self, image):
        """Preprocess image for model input"""
        try:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)
            return img_tensor
            
        except Exception as e:
            raise RuntimeError(f"Error preprocessing image: {e}")
    
    def predict(self, image, confidence_threshold=0.5):
        """Make prediction - NO FALLBACK, REAL MODEL ONLY"""
        if self.model is None:
            raise RuntimeError("Model not loaded! Cannot make predictions.")
        
        try:
            # Preprocess image
            img_tensor = self.preprocess_image(image)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(img_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
            
            # Get all class probabilities
            all_probs = {}
            for i, class_name in enumerate(self.classes):
                all_probs[class_name] = float(probabilities[i].cpu().numpy())
            
            # Get top prediction
            max_prob, predicted_class_idx = torch.max(probabilities, dim=0)
            max_prob_val = float(max_prob.cpu().numpy())
            predicted_class = self.classes[predicted_class_idx]
            
            # Check confidence threshold
            if max_prob_val < confidence_threshold:
                print(f"⚠️  Low confidence prediction: {predicted_class} ({max_prob_val:.3f})")
            
            return all_probs, predicted_class, max_prob_val
            
        except Exception as e:
            raise RuntimeError(f"Prediction failed: {e}")
    
    def get_model_info(self):
        """Get detailed model information"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        return {
            "model_type": "VGG16+SegNet",
            "device": str(self.device),
            "input_size": "244x244",
            "total_params": f"{total_params:,}",
            "trainable_params": f"{trainable_params:,}",
            "classes": self.classes,
            "model_file": self.model_path,
            "file_size_mb": f"{os.path.getsize(self.model_path) / (1024*1024):.1f}",
            "preprocessing": "Resize(244,244) + Normalize(0.5,0.5,0.5)"
        }

# Initialize model handler
model_handler = ModelHandler()

@app.on_event("startup")
async def startup_event():
    """MANDATORY model loading on startup"""
    print("🚀 Starting ROP Classifier API...")
    print(f"📁 Looking for model: {model_handler.model_path}")
    print(f"📂 Current directory: {os.getcwd()}")
    
    try:
        # MANDATORY: Load model or fail
        model_handler.load_model()
        print("🎉 API ready with loaded model!")
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        print("\n🛑 API CANNOT START WITHOUT MODEL!")
        print("📋 CHECKLIST:")
        print("   ✓ Place your trained model file in python-api/")
        print("   ✓ Name it 'Vgg16+Segnet_model.pth' or update the path")
        print("   ✓ Ensure the model architecture matches ROPNet")
        print("   ✓ Verify the model was trained with 4 classes")
        print("\n💡 Once fixed, restart the API")
        
        # Exit the application
        sys.exit(1)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Make prediction - REAL MODEL ONLY"""
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        print(f"🔍 Processing: {file.filename} ({image.size}, {image.mode})")
        
        # REAL PREDICTION ONLY - NO MOCK FALLBACK
        all_probs, predicted_class, confidence = model_handler.predict(image)
        
        # Format response
        predictions = []
        for class_name, prob in all_probs.items():
            predictions.append({
                "class": class_name,
                "confidence": float(prob)
            })
        
        # Sort by confidence
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        response = {
            "predictions": predictions,
            "topPrediction": {
                "class": predicted_class,
                "confidence": confidence
            },
            "success": True,
            "model_info": model_handler.get_model_info(),
            "timestamp": "real_prediction"
        }
        
        print(f"✅ Prediction: {predicted_class} ({confidence:.3f})")
        return response
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check - model must be loaded"""
    model_loaded = model_handler.model is not None
    
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded - API not ready")
    
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_info": model_handler.get_model_info(),
        "ready": True
    }

@app.get("/")
async def root():
    """Root endpoint"""
    model_loaded = model_handler.model is not None
    
    return {
        "message": "ROP Classifier API",
        "status": "running" if model_loaded else "model_not_loaded",
        "model_loaded": model_loaded,
        "ready": model_loaded
    }

if __name__ == "__main__":
    print("🚀 Starting ROP Classifier API...")
    print("⚠️  Model loading is MANDATORY - API will exit if model fails to load")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
