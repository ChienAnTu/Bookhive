from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routes.auth import router as auth_router
from routes.users import router as user_router
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routes.upload import router as upload_router
from routes.books import router as books_router
from routes.messages import router as message_router
from routes.cart import router as cart_router
from routes.complaints import router as complaints_router  # routes/complaints
from routes.shipping import router as shipping_router  # Import shipping router
from routes.service_fee import router as service_fee_router
from routes.checkout import router as checkout_router  # Import checkout router
from routes.order import router as orders_router
from routes.payment_gateway import router as payment_gateway_router
from routes.stripe_connect import router as stripe_connect_router

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

#service checkout router
app.include_router(checkout_router, prefix="/api/v1")

#service fee router
app.include_router(service_fee_router, prefix="/api/v1")

# shipping router
app.include_router(shipping_router)

# media root directory: /media is mounted to the app/media folder
MEDIA_ROOT = Path(__file__).parent / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")

app.include_router(upload_router)

# Include auth router
app.include_router(auth_router, prefix="/api/v1")

# user router
app.include_router(user_router, prefix="/api/v1")

# books router
app.include_router(books_router)
app.include_router(message_router, prefix="/api/v1")

# cart router
app.include_router(cart_router, prefix="/api/v1")

# complaints router
app.include_router(complaints_router, prefix="/api/v1")

# order router
app.include_router(orders_router, prefix="/api/v1/orders")

# payment gateway router
app.include_router(payment_gateway_router) 

# Stripe connect account router
app.include_router(stripe_connect_router)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} Authentication API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)