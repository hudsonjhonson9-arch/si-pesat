import requests
import os

url = "https://pmtmczqxrciaslgmjfim.supabase.co/rest/v1/audits?select=*&limit=1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdG1jenF4cmNpYXNsZ21qZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY2NzQsImV4cCI6MjA5NjgxMjY3NH0.5kF1pq_MyvzqCl3Jhv2HvbNwjCpyBQWllhZUnsHZlMg"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

print("Testing audits table...")
res = requests.get(url, headers=headers)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")

print("Testing templates table...")
url_templates = "https://pmtmczqxrciaslgmjfim.supabase.co/rest/v1/templates?select=*&limit=1"
res_templates = requests.get(url_templates, headers=headers)
print(f"Status: {res_templates.status_code}")
print(f"Response: {res_templates.text}")
