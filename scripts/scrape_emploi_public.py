import json
import os
import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore


def scrape_last_chance_offers():
    url = "https://www.emploi-public.ma/fr/concours-liste"
    base_url = "https://www.emploi-public.ma"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")

    last_chance_offers = []

    header = soup.find(string=re.compile("Dernière chance pour postuler", re.IGNORECASE))
    if not header:
        print("Could not find the 'Last Chance' section.")
        return []

    section_container = header.find_parent("section")
    if not section_container:
        print("Could not find the section wrapper.")
        return []

    cards = section_container.find_all("a", class_="card")

    for card in cards:
        offer = {}

        relative_link = card.get("href")
        offer["url"] = base_url + relative_link if relative_link else ""
        offer["id"] = relative_link.split("/")[-1] if relative_link else None

        title_tag = card.find("h3", class_="card-title")
        offer["title"] = title_tag.text.strip() if title_tag else "No Title"

        org_div = card.find("div", class_="card-text")
        offer["organization"] = org_div.text.strip() if org_div else "Unknown"

        img_tag = card.find("img")
        if img_tag and img_tag.get("src"):
            offer["image_url"] = base_url + img_tag.get("src")

        msg_div = card.find("div", class_="card-msg")
        if msg_div:
            offer["urgency_message"] = msg_div.text.strip()

        footer = card.find("div", class_="card-footer")
        if footer:
            suitcase = footer.find("i", class_="icon-suitcase")
            if suitcase and suitcase.parent:
                offer["posts_count"] = suitcase.parent.text.strip()

            timeout = footer.find("i", class_="icon-time-out")
            if timeout and timeout.parent:
                raw_date = timeout.parent.text.replace("Limite de dépôt :", "").strip()
                offer["deadline"] = raw_date

        if offer.get("id"):
            last_chance_offers.append(offer)

    return last_chance_offers


def init_firestore():
    service_account = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if not service_account:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is required")

    cred = credentials.Certificate(json.loads(service_account))
    firebase_admin.initialize_app(cred)
    return firestore.client()


def upsert_offers(db, offers):
    collection = db.collection("emploiPublicOffers")
    for offer in offers:
        doc_id = offer["id"]
        offer_payload = {
            **offer,
            "source": "emploi-public",
            "updatedAt": datetime.utcnow().isoformat(),
        }
        collection.document(doc_id).set(offer_payload, merge=True)


if __name__ == "__main__":
    offers = scrape_last_chance_offers()
    if not offers:
        print("No offers scraped.")
        raise SystemExit(1)

    db = init_firestore()
    upsert_offers(db, offers)
    print(json.dumps(offers, indent=2, ensure_ascii=False))
