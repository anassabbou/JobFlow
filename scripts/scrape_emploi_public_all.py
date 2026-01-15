import json
import os
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore


def parse_french_date(date_str):
    """Parse French date format like '18 Janvier 2026' into datetime object."""
    date_part = date_str.split("\n")[0].strip()

    month_map = {
        "janvier": 1,
        "février": 2,
        "mars": 3,
        "avril": 4,
        "mai": 5,
        "juin": 6,
        "juillet": 7,
        "août": 8,
        "septembre": 9,
        "octobre": 10,
        "novembre": 11,
        "décembre": 12,
    }

    try:
        parts = date_part.split()
        if len(parts) >= 3:
            day = int(parts[0])
            month_name = parts[1].lower()
            year = int(parts[2])

            month = month_map.get(month_name)
            if month:
                return datetime(year, month, day)
    except (ValueError, IndexError, KeyError):
        pass

    return None


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
    current_date = datetime(2026, 1, 15)

    while True:
        print(f"Scraping page {page_number}...")
        params = {"page": page_number}

        max_retries = 3
        retry_count = 0
        success = False

        while retry_count < max_retries and not success:
            try:
                response = requests.get(search_url, headers=headers, params=params, timeout=30)

                if response.status_code != 200:
                    print(f"Stopped: Status code {response.status_code} at page {page_number}")
                    return all_jobs

                success = True
            except requests.exceptions.Timeout:
                retry_count += 1
                if retry_count < max_retries:
                    print(f"Timeout on page {page_number}, retrying ({retry_count}/{max_retries})...")
                    time.sleep(5 * retry_count)
                else:
                    print(f"Failed to scrape page {page_number} after {max_retries} retries. Skipping.")
                    page_number += 1
                    continue
            except Exception as e:
                print(f"Error on page {page_number}: {e}")
                break

        if not success:
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
                job_data["id"] = relative_link.split("/")[-1] if relative_link else "N/A"

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
                    deadline_date = parse_french_date(raw_date)

                suitcase_icon = footer.find("i", class_="icon-suitcase")
                if suitcase_icon and suitcase_icon.parent:
                    job_data["posts_count"] = suitcase_icon.parent.text.strip()

            if deadline_date and deadline_date > current_date:
                all_jobs.append(job_data)
                print(f"Added job: {job_data['title'][:50]}... (Deadline: {job_data['deadline']})")
            else:
                print(
                    f"Skipped job: {job_data['title'][:50]}... "
                    f"(Deadline: {job_data.get('deadline', 'N/A')} - expired or invalid)"
                )

        next_button = soup.find("a", class_="page-link next")
        if not next_button:
            print("No 'Next' button found. Reached last page.")
            break

        page_number += 1
        time.sleep(2)

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

    with open("jobs_data.json", "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=4, ensure_ascii=False)

    if not jobs:
        raise SystemExit(1)

    db = init_firestore()
    upsert_offers(db, jobs)
    print(json.dumps(jobs, indent=2, ensure_ascii=False))
