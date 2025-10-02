import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_complete_data_pipeline(state: dict) -> Dict[str, Any]:
    """
    Execute the complete data processing pipeline in a single tool call.
    This reduces LLM calls by combining all preprocessing steps.
    """
    logger.info("Starting complete data processing pipeline")
    
    try:
        # Step 1: Normalize data
        normalize_result = normalize_data_formats(state)
        
        # Step 2: Apply noise reduction
        noise_result = apply_noise_reduction(state)
        
        # Step 3: Validate data
        validation_result = validate_sensor_data(state)
        
        # Step 4: Calculate quality metrics
        quality_result = calculate_data_quality_metrics(state)
        
        # Compile comprehensive status
        pipeline_report = {
            "status": "success",
            "message": "Complete data processing pipeline executed successfully",
            "pipeline_steps": {
                "normalization": normalize_result,
                "noise_reduction": noise_result, 
                "validation": validation_result,
                "quality_assessment": quality_result
            },
            "execution_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Save pipeline report to state
        state["pipeline_report"] = pipeline_report
        logger.info("Data processing pipeline completed successfully")
        
        return pipeline_report
        
    except Exception as e:
        error_report = {
            "status": "error",
            "message": f"Pipeline execution failed: {str(e)}",
            "execution_timestamp": datetime.now(timezone.utc).isoformat()
        }
        state["pipeline_report"] = error_report
        logger.error(f"Pipeline execution failed: {e}")
        return error_report

def normalize_data_formats(state: dict) -> Dict[str, Any]:
    """
    Standardize data formats and units across all sensors by reading from session state.
    Enhanced with better error handling and detailed status reporting.
    """
    try:
        # Read raw data from collection phase
        sensor_data = {
            "weather": state.get("weather_data", {}),
            "cctv": state.get("cctv_data", {}),
            "iot_data": state.get("iot_data", {})
        }
        
        # Handle JSON strings if necessary
        for key in sensor_data:
            if isinstance(sensor_data[key], str):
                try:
                    sensor_data[key] = json.loads(sensor_data[key])
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse {key} as JSON, using empty dict")
                    sensor_data[key] = {}
        
        normalized = {}
        processing_stats = {"sources_processed": 0, "fields_normalized": 0, "errors": []}
        
        # Normalize weather data - handle WeatherAPI structure
        weather = sensor_data.get("weather", {})
        if weather and not weather.get("error"):
            try:
                current = weather.get("current", {})
                condition = current.get("condition", {})
                air_quality = current.get("air_quality", {})
                collection_metadata = weather.get("collection_metadata", {})
                
                air_quality_value = 50
                if isinstance(air_quality, dict) and air_quality:
                    air_quality_value = (
                        air_quality.get("us-epa-index") or 
                        air_quality.get("gb-defra-index") or 
                        air_quality.get("pm2_5", 50)
                    )
                
                normalized["weather"] = {
                    "condition": str(condition.get("text", "unknown")).lower(),
                    "temperature_celsius": float(current.get("temp_c", 0)),
                    "wind_kph": float(current.get("wind_kph", 0)),
                    "humidity_percent": int(current.get("humidity", 0)),
                    "air_quality_index": int(air_quality_value),
                    "metadata": {
                        "source": "WeatherAPI",
                        "collection_timestamp": collection_metadata.get("collected_at", datetime.now(timezone.utc).isoformat()),
                        "preprocessing_applied": ["validation", "normalization", "noise_reduction"],
                        "location_resolved": collection_metadata.get("location_resolved", "unknown")
                    }
                }
                processing_stats["sources_processed"] += 1
                processing_stats["fields_normalized"] += 5
            except Exception as e:
                processing_stats["errors"].append(f"Weather normalization error: {str(e)}")
        
        # Normalize CCTV data
        cctv = sensor_data.get("cctv", {})
        if cctv:
            try:
                camera_metadata = cctv.get("camera_metadata", {})
                normalized["cctv"] = {
                    "zone_id": str(cctv.get("zone_id", "unknown")),
                    "pedestrian_count": int(cctv.get("pedestrian_count", 0)),
                    "vehicle_count": int(cctv.get("vehicle_count", 0)),
                    "congestion_level": round(float(cctv.get("congestion_level", 0)), 3),
                    "incident_detected": bool(cctv.get("incident_detected", False)),
                    "metadata": {
                        "camera_id": camera_metadata.get("camera_id", "unknown"),
                        "collection_timestamp": cctv.get("collected_at", datetime.now(timezone.utc).isoformat()),
                        "detection_confidence": camera_metadata.get("detection_confidence", 0.9),
                        "preprocessing_applied": ["validation", "normalization", "smoothing"]
                    }
                }
                if cctv.get("incident_details"):
                    normalized["cctv"]["incident_details"] = cctv["incident_details"]
                processing_stats["sources_processed"] += 1
                processing_stats["fields_normalized"] += 4
            except Exception as e:
                processing_stats["errors"].append(f"CCTV normalization error: {str(e)}")
        
        # Normalize IoT sensor data
        iot = sensor_data.get("iot_data", {})
        if iot:
            try:
                sensor_metadata = iot.get("sensor_metadata", {})
                additional_metrics = iot.get("additional_metrics", {})
                normalized["iot_data"] = {
                    "zone_id": str(iot.get("zone_id", "unknown")),
                    "air_quality_index": int(iot.get("air_quality_index", 50)),
                    "noise_level_db": int(iot.get("noise_level_db", 50)),
                    "ambient_light_lux": int(iot.get("ambient_light_lux", 200)),
                    "additional_metrics": additional_metrics,
                    "metadata": {
                        "sensor_network_id": sensor_metadata.get("sensor_network_id", "unknown"),
                        "collection_timestamp": iot.get("collected_at", datetime.now(timezone.utc).isoformat()),
                        "data_reliability": sensor_metadata.get("data_reliability", 0.9),
                        "preprocessing_applied": ["validation", "normalization", "filtering"]
                    }
                }
                processing_stats["sources_processed"] += 1
                processing_stats["fields_normalized"] += 4
            except Exception as e:
                processing_stats["errors"].append(f"IoT normalization error: {str(e)}")
        
        # SAVE TO STATE
        state["normalized_data"] = normalized
        state["normalization_stats"] = processing_stats
        
        logger.info(f"Normalized {len(normalized)} data sources: {list(normalized.keys())}")
        
        # Return enhanced status for agent response
        return {
            "status": "success" if not processing_stats["errors"] else "partial_success", 
            "message": f"Normalized data for {len(normalized)} data sources",
            "data_sources": list(normalized.keys()),
            "processing_stats": processing_stats,
            "fields_normalized": processing_stats["fields_normalized"]
        }
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Normalization failed: {str(e)}",
            "data_sources": [],
            "processing_stats": {"sources_processed": 0, "fields_normalized": 0, "errors": [str(e)]}
        }
        state["normalization_error"] = error_result
        logger.error(f"Normalization failed: {e}")
        return error_result

def apply_noise_reduction(state: dict) -> Dict[str, Any]:
    """
    Apply noise reduction and save filtered data to state.
    Enhanced with better error handling and processing metrics.
    """
    try:
        # Read from normalized data
        normalized_data = state.get("normalized_data", {})
        
        # Handle JSON strings
        if isinstance(normalized_data, str):
            try:
                normalized_data = json.loads(normalized_data)
            except json.JSONDecodeError:
                normalized_data = {}
        
        # Safe copy that works with both dict and other types
        if isinstance(normalized_data, dict):
            filtered_data = {}
            for key, value in normalized_data.items():
                if isinstance(value, dict):
                    filtered_data[key] = value.copy()
                else:
                    filtered_data[key] = value
        else:
            logger.warning(f"Expected dict but got {type(normalized_data)}, creating empty dict")
            filtered_data = {}
        
        filtering_stats = {"fields_filtered": 0, "outliers_corrected": 0, "errors": []}
        
        # Simple outlier detection and correction for numeric values
        def smooth_value(value, expected_range, default, field_name):
            """Apply basic smoothing logic with tracking"""
            if not isinstance(value, (int, float)):
                return default
            
            min_val, max_val = expected_range
            if value < min_val or value > max_val:
                filtering_stats["outliers_corrected"] += 1
                logger.info(f"Corrected outlier in {field_name}: {value} -> {(min_val + max_val) / 2}")
                return (min_val + max_val) / 2
            filtering_stats["fields_filtered"] += 1
            return value
        
        # Apply smoothing to weather data
        if "weather" in filtered_data:
            weather = filtered_data["weather"]
            weather["temperature_celsius"] = smooth_value(
                weather.get("temperature_celsius", 20), (-20, 50), 20, "temperature"
            )
            weather["wind_kph"] = smooth_value(
                weather.get("wind_kph", 10), (0, 100), 10, "wind_speed"
            )
            weather["humidity_percent"] = smooth_value(
                weather.get("humidity_percent", 50), (0, 100), 50, "humidity"
            )
        
        # Apply smoothing to CCTV data
        if "cctv" in filtered_data:
            cctv = filtered_data["cctv"]
            cctv["pedestrian_count"] = int(smooth_value(
                cctv.get("pedestrian_count", 10), (0, 200), 10, "pedestrian_count"
            ))
            cctv["vehicle_count"] = int(smooth_value(
                cctv.get("vehicle_count", 20), (0, 300), 20, "vehicle_count"
            ))
            cctv["congestion_level"] = round(smooth_value(
                cctv.get("congestion_level", 0.3), (0, 1), 0.3, "congestion_level"
            ), 3)
        
        # Apply smoothing to IoT data
        if "iot_data" in filtered_data:
            iot = filtered_data["iot_data"]
            iot["air_quality_index"] = int(smooth_value(
                iot.get("air_quality_index", 50), (0, 300), 50, "air_quality"
            ))
            iot["noise_level_db"] = int(smooth_value(
                iot.get("noise_level_db", 50), (20, 120), 50, "noise_level"
            ))
            iot["ambient_light_lux"] = int(smooth_value(
                iot.get("ambient_light_lux", 200), (0, 2000), 200, "ambient_light"
            ))
        
        # SAVE TO STATE
        state["filtered_data"] = filtered_data
        state["filtering_stats"] = filtering_stats
        
        logger.info(f"Applied noise reduction to {len(filtered_data)} data sources")
        
        # Return enhanced status
        return {
            "status": "success",
            "message": f"Applied noise reduction to {len(filtered_data)} data sources",
            "processed_sources": list(filtered_data.keys()),
            "filtering_stats": filtering_stats,
            "outliers_corrected": filtering_stats["outliers_corrected"]
        }
        
    except Exception as e:
        error_result = {
            "status": "error", 
            "message": f"Noise reduction failed: {str(e)}",
            "processed_sources": [],
            "filtering_stats": {"fields_filtered": 0, "outliers_corrected": 0, "errors": [str(e)]}
        }
        state["filtering_error"] = error_result
        logger.error(f"Noise reduction failed: {e}")
        return error_result

def validate_sensor_data(state: dict) -> Dict[str, Any]:
    """
    Validate sensor data and save validation report to state.
    Enhanced with detailed validation metrics.
    """
    try:
        # Read filtered data
        filtered_data_raw = state.get("filtered_data", {})
        
        # Handle JSON strings
        if isinstance(filtered_data_raw, str):
            try:
                sensor_data = json.loads(filtered_data_raw)
            except json.JSONDecodeError:
                sensor_data = {}
        else:
            sensor_data = filtered_data_raw if isinstance(filtered_data_raw, dict) else {}
        
        validation_report = {}
        total_validations = 0
        failed_validations = 0
        
        # Weather data validation
        weather = sensor_data.get("weather", {})
        if weather:
            temp = weather.get("temperature_celsius", 0)
            wind = weather.get("wind_kph", 0)
            humidity = weather.get("humidity_percent", 0)
            
            weather_issues = []
            validations = [
                (temp >= -50 and temp <= 60, f"Temperature out of range: {temp}°C"),
                (wind >= 0 and wind <= 200, f"Wind speed out of range: {wind} kph"),
                (humidity >= 0 and humidity <= 100, f"Humidity out of range: {humidity}%")
            ]
            
            for is_valid, error_msg in validations:
                total_validations += 1
                if not is_valid:
                    weather_issues.append(error_msg)
                    failed_validations += 1
            
            validation_report["weather_validation"] = {
                "status": "INVALID" if weather_issues else "VALID",
                "issues": weather_issues,
                "fields_validated": 3,
                "fields_passed": 3 - len(weather_issues)
            }
        
        # CCTV data validation
        cctv = sensor_data.get("cctv", {})
        if cctv:
            pedestrians = cctv.get("pedestrian_count", 0)
            vehicles = cctv.get("vehicle_count", 0)
            congestion = cctv.get("congestion_level", 0)
            
            cctv_issues = []
            validations = [
                (pedestrians >= 0 and pedestrians <= 1000, f"Pedestrian count out of range: {pedestrians}"),
                (vehicles >= 0 and vehicles <= 500, f"Vehicle count out of range: {vehicles}"),
                (congestion >= 0 and congestion <= 1, f"Congestion level out of range: {congestion}")
            ]
            
            for is_valid, error_msg in validations:
                total_validations += 1
                if not is_valid:
                    cctv_issues.append(error_msg)
                    failed_validations += 1
            
            validation_report["cctv_validation"] = {
                "status": "INVALID" if cctv_issues else "VALID",
                "issues": cctv_issues,
                "fields_validated": 3,
                "fields_passed": 3 - len(cctv_issues)
            }
        
        # IoT sensors validation
        iot = sensor_data.get("iot_data", {})
        if iot:
            aqi = iot.get("air_quality_index", 0)
            noise = iot.get("noise_level_db", 0)
            light = iot.get("ambient_light_lux", 0)
            
            iot_issues = []
            validations = [
                (aqi >= 0 and aqi <= 500, f"AQI out of range: {aqi}"),
                (noise >= 0 and noise <= 150, f"Noise level out of range: {noise} dB"),
                (light >= 0 and light <= 50000, f"Light level out of range: {light} lux")
            ]
            
            for is_valid, error_msg in validations:
                total_validations += 1
                if not is_valid:
                    iot_issues.append(error_msg)
                    failed_validations += 1
            
            validation_report["iot_validation"] = {
                "status": "INVALID" if iot_issues else "VALID",
                "issues": iot_issues,
                "fields_validated": 3,
                "fields_passed": 3 - len(iot_issues)
            }
        
        # Calculate overall validation metrics
        all_issues = []
        for validation in validation_report.values():
            if isinstance(validation, dict):
                all_issues.extend(validation.get("issues", []))
        
        validation_report["overall_status"] = "INVALID" if all_issues else "VALID"
        validation_report["validation_summary"] = {
            "total_validations": total_validations,
            "failed_validations": failed_validations,
            "success_rate": (total_validations - failed_validations) / total_validations if total_validations > 0 else 1.0
        }
        
        # SAVE TO STATE
        state["validation_report"] = validation_report
        
        # Return enhanced status
        return {
            "status": "success",
            "message": "Validation completed",
            "overall_status": validation_report.get("overall_status", "UNKNOWN"),
            "issues_found": len(all_issues),
            "validation_summary": validation_report["validation_summary"]
        }
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Validation failed: {str(e)}",
            "overall_status": "ERROR",
            "issues_found": 0,
            "validation_summary": {"total_validations": 0, "failed_validations": 0, "success_rate": 0.0}
        }
        state["validation_error"] = error_result
        logger.error(f"Validation failed: {e}")
        return error_result

def calculate_data_quality_metrics(state: dict) -> Dict[str, Any]:
    """
    Calculate quality metrics and save to state.
    Enhanced with comprehensive quality assessment.
    """
    try:
        # Read all necessary data with JSON string handling
        def safe_get_data(key, default={}):
            raw_data = state.get(key, default)
            if isinstance(raw_data, str):
                try:
                    return json.loads(raw_data)
                except json.JSONDecodeError:
                    return default
            return raw_data if isinstance(raw_data, dict) else default
        
        original_data = {
            "weather": safe_get_data("weather_data"),
            "cctv": safe_get_data("cctv_data"),
            "iot_data": safe_get_data("iot_data")
        }
        processed_data = safe_get_data("filtered_data")
        validation_report = safe_get_data("validation_report")
        
        metrics = {
            "completeness_score": 0.0,
            "accuracy_score": 0.0,
            "consistency_score": 0.0,
            "timeliness_score": 0.0,
            "overall_quality": 0.0,
            "processing_summary": {},
            "detailed_metrics": {}
        }
        
        # Calculate completeness (how much data we have vs expected)
        expected_fields = ["weather", "cctv", "iot_data"]
        available_fields = [field for field in expected_fields if field in processed_data and processed_data[field]]
        if expected_fields:
            metrics["completeness_score"] = len(available_fields) / len(expected_fields)
        
        # Calculate accuracy (enhanced with validation report integration)
        if validation_report and "validation_summary" in validation_report:
            metrics["accuracy_score"] = validation_report["validation_summary"].get("success_rate", 0.0)
        else:
            # Fallback to original accuracy calculation
            accuracy_factors = []
            
            # Check weather data accuracy
            if "weather" in processed_data and processed_data["weather"]:
                weather = processed_data["weather"]
                temp_valid = -20 <= weather.get("temperature_celsius", 20) <= 50
                wind_valid = 0 <= weather.get("wind_kph", 10) <= 100
                humidity_valid = 0 <= weather.get("humidity_percent", 50) <= 100
                accuracy_factors.extend([temp_valid, wind_valid, humidity_valid])
            
            # Check CCTV data accuracy
            if "cctv" in processed_data and processed_data["cctv"]:
                cctv = processed_data["cctv"]
                pedestrian_valid = 0 <= cctv.get("pedestrian_count", 10) <= 200
                vehicle_valid = 0 <= cctv.get("vehicle_count", 20) <= 300
                congestion_valid = 0 <= cctv.get("congestion_level", 0.3) <= 1
                accuracy_factors.extend([pedestrian_valid, vehicle_valid, congestion_valid])
            
            # Check IoT data accuracy
            if "iot_data" in processed_data and processed_data["iot_data"]:
                iot = processed_data["iot_data"]
                aqi_valid = 0 <= iot.get("air_quality_index", 50) <= 300
                noise_valid = 20 <= iot.get("noise_level_db", 50) <= 120
                light_valid = 0 <= iot.get("ambient_light_lux", 200) <= 2000
                accuracy_factors.extend([aqi_valid, noise_valid, light_valid])

            metrics["accuracy_score"] = sum(accuracy_factors) / len(accuracy_factors) if accuracy_factors else 0.0
        
        # Calculate consistency (cross-sensor logical consistency)
        consistency_checks = []
        
        if "weather" in processed_data and "iot_data" in processed_data:
            weather_aqi = processed_data["weather"].get("air_quality_index", 50)
            iot_aqi = processed_data["iot_data"].get("air_quality_index", 50)
            aqi_consistent = abs(weather_aqi - iot_aqi) <= 50
            consistency_checks.append(aqi_consistent)
        
        if "cctv" in processed_data and "iot_data" in processed_data:
            congestion = processed_data["cctv"].get("congestion_level", 0)
            noise = processed_data["iot_data"].get("noise_level_db", 50)
            noise_congestion_consistent = (congestion > 0.7 and noise > 60) or (congestion <= 0.7)
            consistency_checks.append(noise_congestion_consistent)
        
        metrics["consistency_score"] = sum(consistency_checks) / len(consistency_checks) if consistency_checks else 1.0
        
        # Calculate timeliness (based on timestamp freshness)
        current_time = datetime.now(timezone.utc)
        timestamp_scores = []
        
        for data_type in ["weather", "cctv", "iot_data"]:
            if data_type in processed_data and processed_data[data_type]:
                metadata = processed_data[data_type].get("metadata", {})
                collection_timestamp = metadata.get("collection_timestamp")
                if collection_timestamp:
                    try:
                        data_time = datetime.fromisoformat(collection_timestamp.replace('Z', '+00:00'))
                        age_minutes = (current_time - data_time).total_seconds() / 60
                        timestamp_score = max(0.0, 1.0 - (age_minutes / 15.0))
                        timestamp_scores.append(timestamp_score)
                    except (ValueError, TypeError):
                        timestamp_scores.append(0.5)
        
        metrics["timeliness_score"] = sum(timestamp_scores) / len(timestamp_scores) if timestamp_scores else 0.8
        
        # Calculate overall quality as weighted average
        weights = {
            "completeness": 0.3,
            "accuracy": 0.3,
            "consistency": 0.2,
            "timeliness": 0.2
        }
        
        metrics["overall_quality"] = (
            weights["completeness"] * metrics["completeness_score"] +
            weights["accuracy"] * metrics["accuracy_score"] +
            weights["consistency"] * metrics["consistency_score"] +
            weights["timeliness"] * metrics["timeliness_score"]
        )
        
        # Enhanced processing summary with filtering stats
        filtering_stats = state.get("filtering_stats", {})
        metrics["processing_summary"] = {
            "total_fields_processed": len(available_fields),
            "data_sources_active": len(available_fields),
            "outliers_corrected": filtering_stats.get("outliers_corrected", 0),
            "quality_grade": "A" if metrics["overall_quality"] > 0.8 else 
                             "B" if metrics["overall_quality"] > 0.6 else
                             "C" if metrics["overall_quality"] > 0.4 else "D",
            "processing_timestamp": current_time.isoformat()
        }
        
        # Add detailed breakdown
        metrics["detailed_metrics"] = {
            "completeness_breakdown": {
                "available_sources": len(available_fields),
                "expected_sources": len(expected_fields),
                "missing_sources": [s for s in expected_fields if s not in available_fields]
            },
            "accuracy_breakdown": {
                "validation_success_rate": metrics["accuracy_score"],
                "validation_details": validation_report.get("validation_summary", {})
            }
        }
        
        # SAVE TO STATE
        state["quality_report"] = metrics
        logger.info(f"Quality calculated: {metrics['overall_quality']:.3f} (Grade: {metrics['processing_summary']['quality_grade']})")
        
        # Return enhanced status
        return {
            "status": "success",
            "message": "Quality metrics calculated",
            "overall_quality": round(metrics["overall_quality"], 3),
            "quality_grade": metrics["processing_summary"]["quality_grade"],
            "detailed_scores": {
                "completeness": round(metrics["completeness_score"], 3),
                "accuracy": round(metrics["accuracy_score"], 3),
                "consistency": round(metrics["consistency_score"], 3),
                "timeliness": round(metrics["timeliness_score"], 3)
            }
        }
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Quality assessment failed: {str(e)}",
            "overall_quality": 0.0,
            "quality_grade": "F",
            "detailed_scores": {"completeness": 0.0, "accuracy": 0.0, "consistency": 0.0, "timeliness": 0.0}
        }
        state["quality_error"] = error_result
        logger.error(f"Quality assessment failed: {e}")
        return error_result
