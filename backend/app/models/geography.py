from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Province(Base):
    __tablename__ = "provinces"

    id = Column(Integer, primary_key=True, index=True) # Matches PROVINCE_ID
    name_th = Column(String, nullable=False, index=True)
    name_en = Column(String, nullable=True)
    
    districts = relationship("District", back_populates="province")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True) # Matches DISTRICT_ID
    province_id = Column(Integer, ForeignKey("provinces.id"), nullable=False, index=True)
    name_th = Column(String, nullable=False, index=True)
    name_en = Column(String, nullable=True)
    code = Column(String, nullable=True) # Matches DISTRICT_CODE

    province = relationship("Province", back_populates="districts")
    sub_districts = relationship("SubDistrict", back_populates="district")

class SubDistrict(Base):
    __tablename__ = "sub_districts"

    id = Column(Integer, primary_key=True, index=True) # Matches SUB_DISTRICT_ID
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    name_th = Column(String, nullable=False, index=True)
    name_en = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    district = relationship("District", back_populates="sub_districts")
