from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter(prefix="/shipping", tags=["Shipping"])

AUSPOST_CALCULATE_API_KEY = os.getenv("AUSPOST_CALCULATE_API_KEY")

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
    Calculate domestic parcel postage cost for both Regular and Express services.
    """
    headers = {"AUTH-KEY": AUSPOST_CALCULATE_API_KEY}
    service_codes = ["AUS_PARCEL_REGULAR", "AUS_PARCEL_EXPRESS"]
    results = {}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for code in service_codes:
                params = {
                    "from_postcode": from_postcode,
                    "to_postcode": to_postcode,
                    "length": length,
                    "width": width,
                    "height": height,
                    "weight": weight,
                    "service_code": code
                }
                response = await client.get(BASE_URL, headers=headers, params=params)

                if response.status_code == 200:
                    data = response.json().get("postage_result", {})
                    results[code] = {
                        "service": data.get("service"),
                        "total_cost": data.get("total_cost"),
                        "delivery_time": data.get("delivery_time"),
                    }
                else:
                    results[code] = {"error": response.text}

        return results

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")