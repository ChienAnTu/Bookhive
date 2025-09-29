import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.review import Review
from models.order import Order
from sqlalchemy import func

# 1. Create review
async def create_review(db: Session, order_id: str, reviewer_id: str, reviewee_id: str, rating: int, comment: str):
    """
    Create a review for an order.
    - Validate that the order is completed.
    - Ensure the reviewer has not already reviewed this order.
    """
    # Check order exists and is completed
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Order is not completed or not found")

    # Check if reviewer already left a review for this order
    existing = db.query(Review).filter(
        Review.order_id == order_id,
        Review.reviewer_id == reviewer_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")

    # Create review
    review = Review(
        id=str(uuid.uuid4()),
        order_id=order_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# 2. Get reviews received by a user
def get_reviews_by_user(db: Session, user_id: str):
    """
    Get all reviews received by a specific user.
    Sorted by created_at desc.
    """
    return db.query(Review).filter(Review.reviewee_id == user_id).order_by(Review.created_at.desc()).all()


# 3. Get reviews for a specific order
def get_reviews_by_order(db: Session, order_id: str):
    """
    Get all reviews linked to a specific order.
    Both reviewer and reviewee can see reviews.
    """
    return db.query(Review).filter(Review.order_id == order_id).order_by(Review.created_at.asc()).all()


# 4. Get average rating summary for a user
def get_user_rating_summary(db: Session, user_id: str):
    """
    Get average rating, total review count, and rating distribution for a user.
    Returns a dict summary.
    """
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).all()

    if not reviews:
        return {
            "average": 0,
            "total_reviews": 0,
            "distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }

    total_reviews = len(reviews)
    average = sum([r.rating for r in reviews]) / total_reviews
    distribution = {i: 0 for i in range(1, 6)}
    for r in reviews:
        distribution[r.rating] += 1

    return {
        "average": round(average, 2),
        "total_reviews": total_reviews,
        "distribution": distribution
    }


# 5. Get reviews written by a reviewer
def get_reviews_by_reviewer(db: Session, reviewer_id: str):
    """
    Get all reviews written by a specific reviewer.
    Sorted by created_at desc.
    """
    return db.query(Review).filter(Review.reviewer_id == reviewer_id).order_by(Review.created_at.desc()).all()