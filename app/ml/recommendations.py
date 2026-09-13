def generate_recommendations(
    project: dict,
    probability: float
) -> list:
    """
    Generate actionable recommendations based on
    project conditions and predicted delay probability.
    """

    recommendations = []

    # Overall risk
    if probability >= 0.70:
        recommendations.append(
            "HIGH PRIORITY: Escalate this project for immediate review by the responsible authority."
        )

    elif probability >= 0.40:
        recommendations.append(
            "MEDIUM PRIORITY: Increase monitoring frequency and review the identified risk drivers."
        )

    else:
        recommendations.append(
            "Continue routine monitoring; no immediate escalation is required."
        )

    # Compensation
    if project["compensation_status"] == "Pending":

        recommendations.append(
            "Prioritize pending compensation cases and initiate a compensation-status review."
        )

    elif project["compensation_status"] == "Partially Paid":

        recommendations.append(
            "Expedite partially paid compensation cases and identify outstanding beneficiaries."
        )

    # Legal disputes
    if project["legal_dispute"] == "Yes":

        recommendations.append(
            "Escalate active legal disputes for legal review and establish a dispute-resolution action plan."
        )

    # Stakeholders
    if project["stakeholder_responsiveness"] == "Low":

        recommendations.append(
            "Initiate stakeholder escalation and schedule targeted follow-up with non-responsive stakeholders."
        )

    elif project["stakeholder_responsiveness"] == "Medium":

        recommendations.append(
            "Increase stakeholder follow-up frequency and track pending responses."
        )

    # Rehabilitation
    if project["rehabilitation_progress_pct"] < 40:

        recommendations.append(
            "Accelerate rehabilitation and resettlement activities and review pending R&R milestones."
        )

    # Affected families
    if project["affected_families"] > 400:

        recommendations.append(
            "Prioritize coordination for the high number of affected families and monitor compensation and R&R cases."
        )

    # Department performance
    if project["historical_dept_performance_score"] < 50:

        recommendations.append(
            "Assign additional administrative oversight and review departmental processing bottlenecks."
        )

    return recommendations