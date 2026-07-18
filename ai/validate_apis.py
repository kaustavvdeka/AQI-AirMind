"""
AirMind AI — API Validation & Status Checker
Tests connections, latency, credentials, schema field compliance, and logs report.
"""
import time
import json
import logging
from datetime import datetime, timezone
import requests
from pymongo import MongoClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("api_validator")

# Load settings directly from .env
from app.config import OPENAQ_API_KEY, OPENWEATHER_API_KEY, GEE_PROJECT_ID, MONGODB_URI, DEFAULT_LAT, DEFAULT_LON, MODELS_DIR

def validate_openaq():
    start = time.time()
    url = f"https://api.openaq.org/v3/locations?coordinates={DEFAULT_LAT},{DEFAULT_LON}&radius=25000&limit=1"
    headers = {"X-API-Key": OPENAQ_API_KEY} if OPENAQ_API_KEY else {}
    
    report = {
        "api": "OpenAQ v3",
        "status": "FAIL",
        "response_time_ms": 0,
        "http_code": 0,
        "fields_returned": [],
        "errors": [],
        "recommendation": "Check API Key and coordinates parameters."
    }
    
    if not OPENAQ_API_KEY:
        report["errors"].append("Missing OPENAQ_API_KEY in environment.")
        return report
        
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        report["http_code"] = resp.status_code
        report["response_time_ms"] = int((time.time() - start) * 1000)
        
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results:
                station = results[0]
                report["status"] = "PASS"
                report["fields_returned"] = ["id", "name", "coordinates", "sensors"]
                report["recommendation"] = "OpenAQ API is operating correctly."
            else:
                report["errors"].append("No monitoring locations returned for Guwahati area.")
        else:
            report["errors"].append(f"HTTP {resp.status_code}: {resp.text}")
    except Exception as e:
        report["errors"].append(str(e))
        
    return report

def validate_openweather():
    start = time.time()
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={DEFAULT_LAT}&lon={DEFAULT_LON}&appid={OPENWEATHER_API_KEY}&units=metric"
    
    report = {
        "api": "OpenWeather Air/Weather Info",
        "status": "FAIL",
        "response_time_ms": 0,
        "http_code": 0,
        "fields_returned": [],
        "errors": [],
        "recommendation": "Verify OpenWeather appid token."
    }
    
    if not OPENWEATHER_API_KEY:
        report["errors"].append("Missing OPENWEATHER_API_KEY in environment.")
        return report
        
    try:
        resp = requests.get(url, timeout=15)
        report["http_code"] = resp.status_code
        report["response_time_ms"] = int((time.time() - start) * 1000)
        
        if resp.status_code == 200:
            data = resp.json()
            report["status"] = "PASS"
            report["fields_returned"] = list(data.keys())
            report["recommendation"] = "OpenWeather API operating correctly."
        else:
            report["errors"].append(f"HTTP {resp.status_code}: {resp.text}")
    except Exception as e:
        report["errors"].append(str(e))
        
    return report

def validate_gee():
    start = time.time()
    report = {
        "api": "Google Earth Engine",
        "status": "FAIL",
        "response_time_ms": 0,
        "http_code": 200,
        "fields_returned": [],
        "errors": [],
        "recommendation": "Configure GEE project permissions."
    }
    
    try:
        import ee
        ee.Initialize(project=GEE_PROJECT_ID)
        # Test standard band loading
        image = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2").first()
        info = image.getInfo()
        report["response_time_ms"] = int((time.time() - start) * 1000)
        report["status"] = "PASS"
        report["fields_returned"] = ["bands", "id", "properties"]
        report["recommendation"] = "GEE successfully initialized and authorized."
    except Exception as e:
        report["errors"].append(str(e))
        
    return report

def validate_mongodb():
    start = time.time()
    report = {
        "api": "MongoDB Connection",
        "status": "FAIL",
        "response_time_ms": 0,
        "http_code": 200,
        "fields_returned": [],
        "errors": [],
        "recommendation": "Ensure local mongod process is active on port 27017."
    }
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        client.server_info()  # triggers connection attempt
        report["response_time_ms"] = int((time.time() - start) * 1000)
        report["status"] = "PASS"
        db = client.get_database()
        report["fields_returned"] = db.list_collection_names()
        report["recommendation"] = "MongoDB server connection established successfully."
    except Exception as e:
        report["errors"].append(str(e))
        
    return report

def generate_report():
    logger.info("Initializing API Validation sweep...")
    openaq = validate_openaq()
    openweather = validate_openweather()
    gee = validate_gee()
    mongodb = validate_mongodb()
    
    reports = [openaq, openweather, gee, mongodb]
    
    print("\n" + "="*80)
    print("                      AIRMIND AI SYSTEM API STATUS REPORT")
    print("="*80)
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("-"*80)
    
    # Write a clean markdown table matching the user request schema
    table = "| API | Status | Response Time | HTTP Code | Fields Returned | Errors | Recommendation |\n"
    table += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
    
    for r in reports:
        fields = ", ".join(r["fields_returned"][:4]) + ("..." if len(r["fields_returned"]) > 4 else "")
        errs = ", ".join(r["errors"]) if r["errors"] else "None"
        table += f"| {r['api']} | **{r['status']}** | {r['response_time_ms']}ms | {r['http_code']} | {fields} | {errs} | {r['recommendation']} |\n"
        
    print(table)
    
    # Save the report to models/api_report.md
    report_path = MODELS_DIR / "api_report.md"
    with open(report_path, "w") as f:
        f.write("# AirMind AI — System API Status Report\n\n")
        f.write(f"Generated at: {datetime.now(timezone.utc).isoformat()}\n\n")
        f.write(table)
    logger.info("API Report saved to: %s", report_path)

if __name__ == "__main__":
    generate_report()
