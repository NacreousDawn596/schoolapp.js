import random
import requests
from generator_emails import GeneratorEmails
import time

generator = GeneratorEmails()

CHROME_VERSIONS = [str(v) for v in range(110, 138)]
WINDOWS_VERSIONS = ["10.0", "11.0"]
MAC_VERSIONS = [
    "10_15_7",
    "11_7_10",
    "12_7_6",
    "13_7_4",
    "14_6_1",
    "15_0"
]

LINUX_ARCHS = [
    "x86_64",
    "i686",
]

ANDROID_VERSIONS = [
    "10", "11", "12", "13", "14", "15"
]

DEVICES = [
    "SM-S918B",      # Galaxy S23 Ultra
    "SM-S926B",      # Galaxy S24+
    "Pixel 8",
    "Pixel 9",
    "Redmi Note 13 Pro",
    "2201116SG",
]

def random_user_agent():
    chrome = random.choice(CHROME_VERSIONS)

    templates = [
        lambda: f"Mozilla/5.0 (Windows NT {random.choice(WINDOWS_VERSIONS)}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",

        lambda: f"Mozilla/5.0 (Macintosh; Intel Mac OS X {random.choice(MAC_VERSIONS)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",

        lambda: f"Mozilla/5.0 (X11; Linux {random.choice(LINUX_ARCHS)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",

        lambda: f"Mozilla/5.0 (Linux; Android {random.choice(ANDROID_VERSIONS)}; {random.choice(DEVICES)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    ]

    return random.choice(templates)()

url = "https://claudeos.com/api/waitlist"

for i in range(100):
    payload = {
        "email": generator.generate_email(),
        "referralCode": "a238f007-633c-45eb-87fd-7acb350440b7"
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": random_user_agent()
    }

    response = requests.post(url, json=payload, headers=headers)
    print(f"Attempt {i+1}: Status Code: {response.status_code}, Response: {response.text}")
    time.sleep(random.uniform(1, 3))  # Sleep for a random time between 1 and 3 seconds
    