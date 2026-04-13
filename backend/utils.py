def calculate_metrics(preds):
    total = sum(preds)
    avg = total / len(preds)
    peak = max(preds)

    return {
        "total": round(total, 2),
        "average": round(avg, 2),
        "peak": round(peak, 2)
    }