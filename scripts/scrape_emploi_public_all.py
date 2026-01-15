import json
import os
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore


def parse_french_deadline(value: str):
    normalized = value.lower().split("-")[0].strip()
    normalized = normalized.replace("1er", "1").replace("er", "").strip()
    months = {
        "janvier": 0,
        "fevrier": 1,
        "février": 1,
        "mars": 2,
        "avril": 3,
        "mai": 4,
        "juin": 5,
        "juillet": 6,
        "aout": 7,
        "août": 7,
        "septembre": 8,
        "octobre": 9,
        "novembre": 10,
        "decembre": 11,
        "décembre": 11,
    }

    parts = normalized.split()
    if len(parts) < 3:
        return None
    day = int(parts[0])
    month = months.get(parts[1])
    year = int(parts[2])
    if month is None:
        return None
    return datetime(year, month + 1, day)


def get_cutoff_datetime():
    cutoff_env = os.environ.get("SCRAPE_CUTOFF_DATE")
    if cutoff_env:
        parsed = parse_french_deadline(cutoff_env)
        if parsed:
            return parsed
    return datetime.now()


def scrape_all_pages():
    base_url = "https://www.emploi-public.ma"
    search_url = "https://www.emploi-public.ma/fr/concours-liste"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
    }

    all_jobs = []
    page_number = 1
    cutoff_datetime = get_cutoff_datetime()

    while True:
        params = {"page": page_number}

        try:
            response = requests.get(search_url, headers=headers, params=params, timeout=10)

            if response.status_code != 200:
                print(f"Stopped: Status code {response.status_code} at page {page_number}")
                break

            soup = BeautifulSoup(response.content, "html.parser")

            items = soup.find_all("div", class_="s-item")
            if not items:
                print(f"No more items found on page {page_number}. Stopping.")
                break

            for item in items:
                job_data = {}

                link_tag = item.find("a", class_="card")
                if link_tag:
                    relative_link = link_tag.get("href")
                    job_data["url"] = base_url + relative_link
                    job_data["id"] = relative_link.split("/")[-1] if relative_link else None

                title_tag = item.find("h2", class_="card-title")
                job_data["title"] = title_tag.text.strip() if title_tag else "No Title"

                org_tag = item.find("div", class_="card-text")
                job_data["organization"] = org_tag.text.strip() if org_tag else "Unknown"

                footer = item.find("div", class_="card-footer")
                deadline_date = None
                if footer:
                    time_icon = footer.find("i", class_="icon-time-out")
                    if time_icon and time_icon.parent:
                        raw_date = time_icon.parent.text.replace("Limite de dépôt :", "").strip()
                        job_data["deadline"] = raw_date
                        deadline_date = parse_french_deadline(raw_date)

                    suitcase_icon = footer.find("i", class_="icon-suitcase")
                    if suitcase_icon and suitcase_icon.parent:
                        job_data["posts_count"] = suitcase_icon.parent.text.strip()

                if job_data.get("id"):
                    if deadline_date and deadline_date < cutoff_datetime:
                        continue
                    all_jobs.append(job_data)

            next_button = soup.find("a", class_="page-link next")
            if not next_button:
                print("No 'Next' button found. Reached last page.")
                break

            page_number += 1
            time.sleep(1)

        except Exception as error:
            print(f"Error on page {page_number}: {error}")
            break

    return all_jobs


def init_firestore():
    service_account = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if not service_account:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is required")

    cred = credentials.Certificate(json.loads(service_account))
    firebase_admin.initialize_app(cred)
    return firestore.client()


def upsert_offers(db, offers):
    collection = db.collection("emploiPublicAllOffers")
    for offer in offers:
        doc_id = offer["id"]
        offer_payload = {
            **offer,
            "source": "emploi-public",
            "updatedAt": datetime.utcnow().isoformat(),
        }
        collection.document(doc_id).set(offer_payload, merge=True)


if __name__ == "__main__":
    jobs = scrape_all_pages()
    print(f"Total jobs scraped: {len(jobs)}")
    if not jobs:
        raise SystemExit(1)

    db = init_firestore()
    upsert_offers(db, jobs)
    print(json.dumps(jobs, indent=2, ensure_ascii=False))
