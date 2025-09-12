from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter(prefix="/shipping", tags=["Shipping"])

AUSPOST_CALCULATE_API_KEY = os.getenv("AUSPOST_CALCULATE_API_KEY");

BASE_URL = "https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json"

@router.get("/domestic/postage/calculate")
async def calculate_domestic_postage(
    from_postcode: str = Query(..., description="Origin postcode"),
    to_postcode: str = Query(..., description="Destination postcode"),
    length: float = Query(..., description="Parcel length in cm"),
    width: float = Query(..., description="Parcel width in cm"),
    height: float = Query(..., description="Parcel height in cm"),
    weight: float = Query(..., description="Parcel weight in kg")
):
    """
    Calculate domestic parcel postage cost using Australia Post PAC API.
    """
    headers = {"AUTH-KEY": AUSPOST_CALCULATE_API_KEY}
    params = {
        "from_postcode": from_postcode,
        "to_postcode": to_postcode,
        "length": length,
        "width": width,
        "height": height,
        "weight": weight,
        "service_code": "AUS_PARCEL_REGULAR"  # default to regular parcel
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(BASE_URL, headers=headers, params=params)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        data = response.json()
        postage_result = data.get("postage_result", {})

        return {
            "service": postage_result.get("service"),
            "total_cost": postage_result.get("total_cost"),
            "delivery_time": postage_result.get("delivery_time")
        }

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")