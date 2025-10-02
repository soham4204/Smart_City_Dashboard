import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Union

# Configure logging for sensor fusion operations
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def safe_get_data_helper(raw: Union[str, Dict[str, Any], None], default: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Safely coerce a dict-like object possibly stored as a JSON string into a dict.
    """
    if default is None:
        default = {}
    if raw is None:
        return default
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            loaded = json.loads(raw)
            return loaded if isinstance(loaded, dict) else default
        except json.JSONDecodeError:
            return default
    return default

def get_situation_level(score: float) -> str:
    """
    Map awareness score [0..1] to a qualitative level.
    """
    if score >= 0.85:
        return "critical"
    if score >= 0.7:
        return "high"
    if score >= 0.45:
        return "moderate"
    if score > 0.0:
        return "low"
    return "unknown"


def generate_situation_context(
    weather_ctx: Dict[str, Any],
    traffic_ctx: Dict[str, Any],
    env_ctx: Dict[str, Any],
    final_score: float
) -> Dict[str, Any]:
    """
    Produce a compact, human-friendly context block summarizing the situation.
    """
    summary_bits: List[str] = []

    # Weather
    cond = str(weather_ctx.get("condition", "unknown"))
    temp = weather_ctx.get("temperature_celsius", None)
    wind = weather_ctx.get("wind_kph", None)
    if cond != "unknown":
        summary_bits.append(f"weather={cond}")
    if isinstance(temp, (int, float)):
        summary_bits.append(f"temp={temp}°C")
    if isinstance(wind, (int, float)) and wind > 0:
        summary_bits.append(f"wind={wind} kph")

    # Traffic
    cong = traffic_ctx.get("congestion_level", None)
    peds = traffic_ctx.get("pedestrian_count", None)
    veh = traffic_ctx.get("vehicle_count", None)
    inc = traffic_ctx.get("incident_detected", False)
    if isinstance(cong, (int, float)):
        summary_bits.append(f"congestion={round(cong, 2)}")
    if isinstance(peds, (int, float)) and peds:
        summary_bits.append(f"peds={int(peds)}")
    if isinstance(veh, (int, float)) and veh:
        summary_bits.append(f"vehicles={int(veh)}")
    if inc:
        summary_bits.append("incident=yes")

    # Environment
    aqi = env_ctx.get("air_quality_index", None)
    noise = env_ctx.get("noise_level_db", None)
    light = env_ctx.get("ambient_light_lux", None)
    if isinstance(aqi, (int, float)):
        summary_bits.append(f"aqi={int(aqi)}")
    if isinstance(noise, (int, float)):
        summary_bits.append(f"noise={int(noise)} dB")
    if isinstance(light, (int, float)):
        summary_bits.append(f"light={int(light)} lux")

    level = get_situation_level(final_score)
    return {
        "summary": f"level={level}; score={round(final_score, 3)}; " + ", ".join(summary_bits),
        "level": level,
        "score": round(final_score, 3),
        "highlights": {
            "adverse_weather": ("rain" in cond or "snow" in cond or (isinstance(wind, (int, float)) and wind > 25)),
            "traffic_incident": bool(inc),
            "air_quality_concern": (isinstance(aqi, (int, float)) and aqi > 100),
            "low_light": (isinstance(light, (int, float)) and light < 50),
        }
    }


def analyze_preprocessing_impact_detailed(
    quality_report: Dict[str, Any],
    validation_report: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Summarize how preprocessing (filtering, outlier removal, imputations) affected data.
    Accepts either dicts or empty placeholders; be permissive.
    """
    qr = quality_report or {}
    vr = validation_report or {}

    # Extract plausible fields if present
    processing_summary = qr.get("processing_summary", {})
    outliers_corrected = int(processing_summary.get("outliers_corrected", qr.get("outliers_corrected", 0) or 0))
    imputations = int(processing_summary.get("imputations", qr.get("imputations", 0) or 0))
    dropped_points = int(processing_summary.get("dropped_points", qr.get("dropped_points", 0) or 0))
    smoothing = bool(processing_summary.get("smoothing_applied", qr.get("smoothing_applied", False) or False))

    # Validation signals
    vr_notes = []
    for k, v in (vr or {}).items():
        if isinstance(v, dict) and "status" in v:
            vr_notes.append(f"{k}:{v.get('status')}")
        elif isinstance(v, str):
            vr_notes.append(f"{k}:{v}")

    return {
        "outliers_corrected": outliers_corrected,
        "imputations": imputations,
        "dropped_points": dropped_points,
        "smoothing_applied": smoothing,
        "validation_summary": vr_notes[:6],  # keep concise
        "notes": processing_summary.get("notes", qr.get("notes", "")),
    }

# ------------------------------------------------------- #
# ENHANCEMENT 1: Comprehensive sensor fusion pipeline tool
# ------------------------------------------------------- #

def process_complete_sensor_fusion(state: dict) -> Dict[str, Any]:
    """
    Execute the complete sensor fusion pipeline in a single tool call.
    This reduces LLM calls by combining all fusion analysis steps.
    """
    logger.info("Starting complete sensor fusion pipeline")

    try:
        # Step 1: Fuse environmental state
        fusion_result = fuse_environmental_state(state)

        # Step 2: Calculate situational awareness
        awareness_result = calculate_situational_awareness(state)

        # Step 3: Perform cross-sensor validation
        validation_result = perform_cross_sensor_validation(state)

        # Step 4: Generate comprehensive analytics
        analytics_result = generate_derived_analytics(state)

        # Compile comprehensive fusion report
        fusion_report = {
            "status": "success",
            "message": "Complete sensor fusion pipeline executed successfully",
            "fusion_steps": {
                "environmental_fusion": fusion_result,
                "situational_awareness": awareness_result,
                "cross_validation": validation_result,
                "derived_analytics": analytics_result
            },
            "execution_timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Save fusion report to state
        state["sensor_fusion_report"] = fusion_report
        logger.info("Sensor fusion pipeline completed successfully")

        return fusion_report

    except Exception as e:
        error_report = {
            "status": "error",
            "message": f"Sensor fusion pipeline failed: {str(e)}",
            "execution_timestamp": datetime.now(timezone.utc).isoformat()
        }
        state["sensor_fusion_error"] = error_report
        logger.error(f"Sensor fusion pipeline failed: {e}")
        return error_report

def fuse_environmental_state(state: dict) -> Dict[str, Any]:
    """
    Fuse preprocessed sensor data into unified environmental state.
    Enhanced with quality-weighted fusion and comprehensive metadata.
    """
    try:
        # Read preprocessed data from state
        def safe_get_data(key, default={}):
            raw_data = state.get(key, default)
            if isinstance(raw_data, str):
                try:
                    return json.loads(raw_data)
                except json.JSONDecodeError:
                    return default
            return raw_data if isinstance(raw_data, dict) else default

        filtered_data = safe_get_data("filtered_data")
        quality_report = safe_get_data("quality_report")
        validation_report = safe_get_data("validation_report")
        extracted_params = safe_get_data("extracted_params")

        # Get quality weights for fusion
        overall_quality = quality_report.get("overall_quality", 0.5) if quality_report else 0.5
        quality_weights = {
            "weather": 1.0,
            "cctv": 1.0,
            "iot_data": 1.0
        }

        # Adjust weights based on validation results
        if validation_report:
            for sensor_type in ["weather", "cctv", "iot"]:
                validation_key = f"{sensor_type}_validation"
                if validation_key in validation_report:
                    status = validation_report[validation_key].get("status", "VALID")
                    if status == "INVALID":
                        quality_weights[sensor_type if sensor_type != "iot" else "iot_data"] = 0.5

        fusion_stats = {"sources_fused": 0, "fields_merged": 0, "quality_weighted": False, "errors": []}

        # Initialize fused environmental state
        fused_state = {
            "zone_id": str(extracted_params.get("zone_id", "unknown")) if extracted_params else "unknown",
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "weather_context": {},
            "traffic_context": {},
            "environmental_context": {},
            "fusion_metadata": {
                "quality_weights_applied": quality_weights,
                "overall_data_quality": overall_quality,
                "preprocessing_utilized": bool(quality_report or validation_report)
            }
        }

        # Fuse weather data with quality weighting
        weather_data = filtered_data.get("weather", {})
        if weather_data and quality_weights["weather"] > 0:
            try:
                weight = quality_weights["weather"]
                fused_state["weather_context"] = {
                    "condition": str(weather_data.get("condition", "unknown")).lower(),
                    "temperature_celsius": round(float(weather_data.get("temperature_celsius", 20)) * weight, 2),
                    "wind_kph": round(float(weather_data.get("wind_kph", 0)) * weight, 2),
                    "humidity_percent": int(float(weather_data.get("humidity_percent", 50)) * weight),
                    "air_quality_index": int(float(weather_data.get("air_quality_index", 50)) * weight),
                    "data_source": "WeatherAPI",
                    "quality_weight": weight
                }
                fusion_stats["sources_fused"] += 1
                fusion_stats["fields_merged"] += 5
            except Exception as e:
                fusion_stats["errors"].append(f"Weather fusion error: {str(e)}")

        # Fuse CCTV traffic data with quality weighting
        cctv_data = filtered_data.get("cctv", {})
        if cctv_data and quality_weights["cctv"] > 0:
            try:
                weight = quality_weights["cctv"]
                fused_state["traffic_context"] = {
                    "pedestrian_count": int(float(cctv_data.get("pedestrian_count", 0)) * weight),
                    "vehicle_count": int(float(cctv_data.get("vehicle_count", 0)) * weight),
                    "congestion_level": round(float(cctv_data.get("congestion_level", 0)) * weight, 3),
                    "incident_detected": bool(cctv_data.get("incident_detected", False)),
                    "zone_id": str(cctv_data.get("zone_id", fused_state["zone_id"])),
                    "data_source": "CCTV_Network",
                    "quality_weight": weight
                }
                if cctv_data.get("incident_details"):
                    fused_state["traffic_context"]["incident_details"] = cctv_data["incident_details"]
                fusion_stats["sources_fused"] += 1
                fusion_stats["fields_merged"] += 4
            except Exception as e:
                fusion_stats["errors"].append(f"CCTV fusion error: {str(e)}")

        # Fuse IoT environmental data with quality weighting
        iot_data = filtered_data.get("iot_data", {})
        if iot_data and quality_weights["iot_data"] > 0:
            try:
                weight = quality_weights["iot_data"]
                additional_metrics = iot_data.get("additional_metrics", {})
                fused_state["environmental_context"] = {
                    "air_quality_index": int(float(iot_data.get("air_quality_index", 50)) * weight),
                    "noise_level_db": int(float(iot_data.get("noise_level_db", 50)) * weight),
                    "ambient_light_lux": int(float(iot_data.get("ambient_light_lux", 200)) * weight),
                    "zone_id": str(iot_data.get("zone_id", fused_state["zone_id"])),
                    "additional_metrics": additional_metrics,
                    "data_source": "IoT_Sensor_Network",
                    "quality_weight": weight
                }
                fusion_stats["sources_fused"] += 1
                fusion_stats["fields_merged"] += 4
            except Exception as e:
                fusion_stats["errors"].append(f"IoT fusion error: {str(e)}")

        # Mark if quality weighting was applied
        fusion_stats["quality_weighted"] = any(w != 1.0 for w in quality_weights.values())

        # SAVE TO STATE
        state["fused_environmental_state"] = fused_state
        state["fusion_stats"] = fusion_stats

        logger.info(f"Fused {fusion_stats['sources_fused']} data sources with {fusion_stats['fields_merged']} fields")

        return {
            "status": "success" if not fusion_stats["errors"] else "partial_success",
            "message": f"Environmental state fused from {fusion_stats['sources_fused']} sources",
            "sources_fused": fusion_stats["sources_fused"],
            "fusion_stats": fusion_stats,
            "quality_weighted": fusion_stats["quality_weighted"]
        }

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Environmental fusion failed: {str(e)}",
            "sources_fused": 0,
            "fusion_stats": {"sources_fused": 0, "fields_merged": 0, "quality_weighted": False, "errors": [str(e)]}
        }
        state["fusion_error"] = error_result
        logger.error(f"Environmental fusion failed: {e}")
        return error_result

def calculate_situational_awareness(state: dict) -> Dict[str, Any]:
    """
    Calculate situational awareness score with preprocessing quality integration.
    Enhanced with comprehensive scoring methodology.
    """
    try:
        # Read fused environmental state
        fused_state = safe_get_data_helper(state.get("fused_environmental_state", {}))
        quality_report = safe_get_data_helper(state.get("quality_report", {}))

        if not fused_state:
            raise ValueError("No fused environmental state available")

        # Extract context data
        weather_ctx = fused_state.get("weather_context", {})
        traffic_ctx = fused_state.get("traffic_context", {})
        env_ctx = fused_state.get("environmental_context", {})

        # Base situational awareness calculation
        score = 0.0
        score_components = {"weather": 0.0, "traffic": 0.0, "environmental": 0.0, "quality_adjustment": 0.0}

        # Weather impact (0.0-0.3)
        temp = weather_ctx.get('temperature_celsius', 20)
        wind = weather_ctx.get('wind_kph', 0)
        humidity = weather_ctx.get('humidity_percent', 50)

        weather_score = 0.0
        if temp < 5 or temp > 35:  # Extreme temperatures
            weather_score += 0.15
        if wind > 25:  # High wind conditions
            weather_score += 0.1
        if humidity > 85 or humidity < 20:  # Extreme humidity
            weather_score += 0.05

        score_components["weather"] = weather_score
        score += weather_score

        # Traffic impact (0.0-0.4)
        congestion = traffic_ctx.get('congestion_level', 0)
        pedestrians = traffic_ctx.get('pedestrian_count', 0)
        vehicles = traffic_ctx.get('vehicle_count', 0)
        incident = traffic_ctx.get('incident_detected', False)

        traffic_score = float(congestion) * 0.25  # Direct congestion impact
        if pedestrians > 40:  # High pedestrian activity
            traffic_score += 0.1
        if vehicles > 80:  # High vehicle count
            traffic_score += 0.05
        if incident:  # Incident detected
            traffic_score += 0.2

        score_components["traffic"] = traffic_score
        score += traffic_score

        # Environmental impact (0.0-0.3)
        aqi = env_ctx.get('air_quality_index', 50)
        noise = env_ctx.get('noise_level_db', 50)
        light = env_ctx.get('ambient_light_lux', 200)

        env_score = 0.0
        if aqi > 100:  # Poor air quality
            env_score += 0.15
        if noise > 70:  # High noise levels
            env_score += 0.1
        if light < 50:  # Low light conditions
            env_score += 0.05

        score_components["environmental"] = env_score
        score += env_score

        # Quality adjustment (±0.1 based on preprocessing quality)
        overall_quality = quality_report.get("overall_quality", 0.5) if quality_report else 0.5
        quality_adjustment = (overall_quality - 0.5) * 0.2  # Scale to ±0.1
        score_components["quality_adjustment"] = quality_adjustment
        score += quality_adjustment

        # Ensure score stays within bounds
        final_score = max(0.0, min(1.0, round(score, 3)))

        # Generate situational context
        situation_context = generate_situation_context(weather_ctx, traffic_ctx, env_ctx, final_score)

        awareness_metrics = {
            "situational_awareness_score": final_score,
            "score_components": score_components,
            "situation_context": situation_context,
            "quality_factor": overall_quality,
            "calculation_timestamp": datetime.now(timezone.utc).isoformat()
        }

        # SAVE TO STATE
        state["situational_awareness"] = awareness_metrics

        logger.info(f"Calculated situational awareness score: {final_score}")

        return {
            "status": "success",
            "message": "Situational awareness calculated",
            "awareness_score": final_score,
            "situation_level": get_situation_level(final_score),
            "score_breakdown": score_components
        }

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Situational awareness calculation failed: {str(e)}",
            "awareness_score": 0.0,
            "situation_level": "unknown",
            "score_breakdown": {}
        }
        state["situational_awareness_error"] = error_result
        logger.error(f"Situational awareness calculation failed: {e}")
        return error_result

def perform_cross_sensor_validation(state: dict) -> Dict[str, Any]:
    """
    Perform cross-sensor validation and correlation analysis.
    Enhanced with detailed correlation metrics.
    """
    try:
        # Read fused environmental state
        fused_state = safe_get_data_helper(state.get("fused_environmental_state", {}))

        if not fused_state:
            raise ValueError("No fused environmental state available")

        weather_ctx = fused_state.get("weather_context", {})
        traffic_ctx = fused_state.get("traffic_context", {})
        env_ctx = fused_state.get("environmental_context", {})

        correlation_results: Dict[str, Any] = {}
        validation_stats = {"correlations_checked": 0, "logical_consistency_score": 0.0, "anomalies_detected": []}

        # Weather-IoT correlation analysis
        if weather_ctx and env_ctx:
            weather_aqi = weather_ctx.get("air_quality_index", 50)
            iot_aqi = env_ctx.get("air_quality_index", 50)

            aqi_difference = abs(float(weather_aqi) - float(iot_aqi))
            aqi_correlation = max(0.0, 1.0 - (aqi_difference / 100.0))

            correlation_results["weather_iot_correlation"] = {
                "air_quality_correlation": round(aqi_correlation, 3),
                "weather_aqi": weather_aqi,
                "iot_aqi": iot_aqi,
                "difference": aqi_difference,
                "status": "CONSISTENT" if aqi_difference <= 25 else "INCONSISTENT"
            }

            if aqi_difference > 50:
                validation_stats["anomalies_detected"].append("Large AQI discrepancy between weather and IoT sensors")

            validation_stats["correlations_checked"] += 1

        # Traffic-Environmental correlation analysis
        if traffic_ctx and env_ctx:
            congestion = float(traffic_ctx.get("congestion_level", 0))
            noise = float(env_ctx.get("noise_level_db", 50))
            vehicle_count = float(traffic_ctx.get("vehicle_count", 0))

            # Expected noise correlation with traffic
            expected_noise = 45 + (congestion * 30) + (vehicle_count * 0.1)
            noise_correlation = 1.0 - min(1.0, abs(noise - expected_noise) / 30.0)

            correlation_results["traffic_environmental_impact"] = {
                "noise_traffic_correlation": round(noise_correlation, 3),
                "actual_noise_db": round(noise, 1),
                "expected_noise_db": round(expected_noise, 1),
                "congestion_level": round(congestion, 3),
                "vehicle_count": int(vehicle_count),
                "status": "CONSISTENT" if noise_correlation > 0.7 else "INCONSISTENT"
            }

            if noise_correlation < 0.5:
                validation_stats["anomalies_detected"].append("Noise levels inconsistent with traffic volume")

            validation_stats["correlations_checked"] += 1

        # Weather-Traffic correlation analysis
        if weather_ctx and traffic_ctx:
            weather_condition = str(weather_ctx.get("condition", "unknown"))
            congestion = float(traffic_ctx.get("congestion_level", 0))
            wind = float(weather_ctx.get("wind_kph", 0))

            # Weather impact on traffic patterns
            weather_impact_expected = ("rain" in weather_condition or "snow" in weather_condition or wind > 20)

            weather_traffic_consistent = True
            if weather_impact_expected and congestion < 0.3:
                weather_traffic_consistent = False
                validation_stats["anomalies_detected"].append("Low traffic despite adverse weather conditions")

            correlation_results["weather_traffic_correlation"] = {
                "weather_condition": weather_condition,
                "traffic_congestion": round(congestion, 3),
                "weather_impact_expected": weather_impact_expected,
                "status": "CONSISTENT" if weather_traffic_consistent else "INCONSISTENT"
            }

            validation_stats["correlations_checked"] += 1

        # Calculate overall logical consistency score
        consistency_scores: List[float] = []
        for correlation in correlation_results.values():
            if isinstance(correlation, dict) and "status" in correlation:
                consistency_scores.append(1.0 if correlation["status"] == "CONSISTENT" else 0.0)

        validation_stats["logical_consistency_score"] = (
            sum(consistency_scores) / len(consistency_scores) if consistency_scores else 1.0
        )

        cross_validation_report = {
            "correlation_analysis": correlation_results,
            "validation_statistics": validation_stats,
            "overall_consistency": validation_stats["logical_consistency_score"],
            "anomalies_count": len(validation_stats["anomalies_detected"])
        }

        # SAVE TO STATE
        state["cross_sensor_validation"] = cross_validation_report

        logger.info(f"Cross-sensor validation completed: {validation_stats['correlations_checked']} correlations checked")

        return {
            "status": "success",
            "message": "Cross-sensor validation completed",
            "correlations_checked": validation_stats["correlations_checked"],
            "consistency_score": round(validation_stats["logical_consistency_score"], 3),
            "anomalies_detected": len(validation_stats["anomalies_detected"])
        }

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Cross-sensor validation failed: {str(e)}",
            "correlations_checked": 0,
            "consistency_score": 0.0,
            "anomalies_detected": 0
        }
        state["cross_validation_error"] = error_result
        logger.error(f"Cross-sensor validation failed: {e}")
        return error_result

def generate_derived_analytics(state: dict) -> Dict[str, Any]:
    """
    Generate comprehensive derived analytics and insights.
    Enhanced with preprocessing impact analysis.
    """
    try:
        # Read all necessary data
        fused_state = safe_get_data_helper(state.get("fused_environmental_state", {}))
        situational_awareness = safe_get_data_helper(state.get("situational_awareness", {}))
        cross_validation = safe_get_data_helper(state.get("cross_sensor_validation", {}))
        quality_report = safe_get_data_helper(state.get("quality_report", {}))
        validation_report = safe_get_data_helper(state.get("validation_report", {}))

        analytics: Dict[str, Any] = {
            "processing_summary": {},
            "quality_assessment": {},
            "situational_insights": {},
            "preprocessing_impact": {},
            "recommendations": []
        }

        # Processing summary
        awareness_score = situational_awareness.get("situational_awareness_score", 0.0)
        analytics["processing_summary"] = {
            "total_sensors_integrated": len([k for k in ["weather_context", "traffic_context", "environmental_context"]
                                             if k in fused_state and fused_state[k]]),
            "situational_awareness_level": get_situation_level(awareness_score),
            "data_fusion_timestamp": datetime.now(timezone.utc).isoformat(),
            "cross_validation_status": "PASSED" if cross_validation.get("overall_consistency", 0) > 0.7 else "WARNING"
        }

        # Enhanced quality assessment
        overall_quality = quality_report.get("overall_quality", 0.0) if quality_report else 0.0
        consistency_score = cross_validation.get("overall_consistency", 0.0) if cross_validation else 0.0

        quality_status = "EXCELLENT"
        if overall_quality < 0.6 or consistency_score < 0.6:
            quality_status = "WARNING"
        elif overall_quality < 0.8 or consistency_score < 0.8:
            quality_status = "GOOD"

        analytics["quality_assessment"] = {
            "status": quality_status,
            "overall_quality_score": round(overall_quality, 3),
            "cross_sensor_consistency": round(consistency_score, 3),
            "data_reliability": "HIGH" if overall_quality > 0.8 else "MEDIUM" if overall_quality > 0.5 else "LOW",
            "notes": f"Data quality: {quality_report.get('processing_summary', {}).get('quality_grade', 'Unknown')} grade"
        }

        # Situational insights
        weather_ctx = fused_state.get("weather_context", {})
        traffic_ctx = fused_state.get("traffic_context", {})
        env_ctx = fused_state.get("environmental_context", {})

        insights: List[str] = []
        risk_factors: List[str] = []

        # Weather insights
        temp = weather_ctx.get("temperature_celsius", 20)
        wind = weather_ctx.get("wind_kph", 0)
        if temp < 10:
            insights.append("Cold weather conditions may affect pedestrian activity")
            risk_factors.append("temperature")
        if wind > 20:
            insights.append("High wind conditions detected")
            risk_factors.append("wind")

        # Traffic insights
        congestion = traffic_ctx.get("congestion_level", 0)
        if congestion > 0.7:
            insights.append("Heavy traffic congestion affecting area mobility")
            risk_factors.append("congestion")
        if traffic_ctx.get("incident_detected", False):
            insights.append("Traffic incident requiring attention")
            risk_factors.append("incident")

        # Environmental insights
        aqi = env_ctx.get("air_quality_index", 50)
        noise = env_ctx.get("noise_level_db", 50)
        if aqi > 100:
            insights.append("Air quality concerns for sensitive individuals")
            risk_factors.append("air_quality")
        if noise > 75:
            insights.append("Elevated noise levels detected")
            risk_factors.append("noise")

        analytics["situational_insights"] = {
            "key_insights": insights,
            "risk_factors": risk_factors,
            "situation_summary": generate_situation_context(weather_ctx, traffic_ctx, env_ctx, awareness_score)
        }

        # Preprocessing impact analysis
        preprocessing_impact = analyze_preprocessing_impact_detailed(quality_report, validation_report)
        analytics["preprocessing_impact"] = preprocessing_impact

        # Generate recommendations
        recommendations: List[str] = []
        if awareness_score > 0.7:
            recommendations.append("Monitor situation closely - elevated awareness level")
        if quality_status in ["WARNING", "POOR"]:
            recommendations.append("Verify sensor calibration - data quality concerns detected")
        if len(risk_factors) > 2:
            recommendations.append("Multiple risk factors present - consider enhanced monitoring")
        if preprocessing_impact.get("outliers_corrected", 0) > 3:
            recommendations.append("Review sensor maintenance - multiple outliers corrected")

        analytics["recommendations"] = recommendations

        # SAVE TO STATE
        state["derived_analytics"] = analytics

        logger.info(f"Generated analytics with {len(insights)} insights and {len(recommendations)} recommendations")

        return {
            "status": "success",
            "message": "Derived analytics generated",
            "insights_generated": len(insights),
            "recommendations_count": len(recommendations),
            "quality_status": quality_status
        }

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Analytics generation failed: {str(e)}",
            "insights_generated": 0,
            "recommendations_count": 0,
            "quality_status": "ERROR"
        }
        state["analytics_error"] = error_result
        logger.error(f"Analytics generation failed: {e}")
        return error_result

def create_comprehensive_fusion_report(state: dict) -> Dict[str, Any]:
    """
    Create the final comprehensive sensor fusion JSON report.
    Enhanced with all preprocessing and fusion metadata.
    """
    try:
        # Read all processed data with safe JSON handling
        extracted_params = safe_get_data_helper(state.get("extracted_params", {}))
        fused_state = safe_get_data_helper(state.get("fused_environmental_state", {}))
        situational_awareness = safe_get_data_helper(state.get("situational_awareness", {}))
        cross_validation = safe_get_data_helper(state.get("cross_sensor_validation", {}))
        derived_analytics = safe_get_data_helper(state.get("derived_analytics", {}))
        quality_report = safe_get_data_helper(state.get("quality_report", {}))

        # Build comprehensive report structure
        comprehensive_report = {
            "fused_environmental_state": {
                "zone_id": fused_state.get("zone_id", "unknown"),
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "weather_context": fused_state.get("weather_context", {}),
                "traffic_context": fused_state.get("traffic_context", {}),
                "environmental_context": fused_state.get("environmental_context", {})
            },
            "derived_analytics": {
                "situational_awareness_score": situational_awareness.get("situational_awareness_score", 0.0),
                "summary": situational_awareness.get("situation_context", {}).get("summary", "No context available"),
                "data_quality_check": {
                    "status": derived_analytics.get("quality_assessment", {}).get("status", "UNKNOWN"),
                    "notes": derived_analytics.get("quality_assessment", {}).get("notes", "No quality data available")
                },
                "cross_sensor_validation": {
                    "weather_iot_correlation": cross_validation.get("correlation_analysis", {}).get("weather_iot_correlation", {}),
                    "traffic_environmental_impact": cross_validation.get("correlation_analysis", {}).get("traffic_environmental_impact", {})
                },
                "preprocessing_impact_analysis": derived_analytics.get("preprocessing_impact", {})
            },
            "metadata": {
                "request_parameters": extracted_params,
                "processing_pipeline": {
                    "data_collection_completed": True,
                    "preprocessing_completed": bool(quality_report),
                    "sensor_fusion_completed": True,
                    "quality_assurance_applied": bool(quality_report)
                },
                "data_quality_summary": quality_report.get("processing_summary", {}) if quality_report else {},
                "fusion_statistics": {
                    "sources_integrated": len([k for k in ["weather_context", "traffic_context", "environmental_context"]
                                               if k in fused_state and fused_state[k]]),
                    "correlations_analyzed": cross_validation.get("validation_statistics", {}).get("correlations_checked", 0),
                    "insights_generated": len(derived_analytics.get("situational_insights", {}).get("key_insights", [])),
                    "recommendations_provided": len(derived_analytics.get("recommendations", []))
                },
                "generation_timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

        # SAVE TO STATE
        state["comprehensive_fusion_report"] = comprehensive_report

        logger.info("Comprehensive sensor fusion report generated successfully")

        return {
            "status": "success",
            "message": "Comprehensive fusion report created",
            "report_sections": len(comprehensive_report),
            "fusion_complete": True
        }

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Fusion report generation failed: {str(e)}",
            "fusion_complete": False
        }
        state["comprehensive_fusion_report_error"] = error_result
        logger.error(f"Comprehensive fusion report generation failed: {e}")
        return error_result
