import subprocess
import os

token = "wyA6GbjTYszoNRmdxzCjT4Th"
targets = ["production", "development", "preview"]

envs = {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyBIXcgKCgoWy-nNS1-uGZaKRZirliPjVZg",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "med-check-app-c4ee9.firebaseapp.com",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "med-check-app-c4ee9",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "med-check-app-c4ee9.firebasestorage.app",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "290380737299",
    "NEXT_PUBLIC_FIREBASE_APP_ID": "1:290380737299:web:904b39389da696eb6a08e6",
    "NEXT_PUBLIC_FIREBASE_VAPID_KEY": "BPGEQuOR0rY9dVYs9OMexB3sxIOHFAuMMwds4jwM--ZX_rCkgVoareHnod3XGFksHyJBL6yjfsriDEb1v0cFiGA",
    "FIREBASE_PROJECT_ID": "med-check-app-c4ee9",
    "FIREBASE_CLIENT_EMAIL": "firebase-adminsdk-fbsvc@med-check-app-c4ee9.iam.gserviceaccount.com",
    # Pass the key exactly as in .env.local (with \n literals) 
    # NOTE: In Python string, \n is newline. We need literal \n characters if that's what's in the file.
    # The file view showed: "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\nMII..."
    # So we use a raw string or escaped backslash.
    "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1BZFf+LkFP/bb\\n3MRSYcVkwYY7Ri14quY/qJ0yp8KqGyZqJNxjnF9qobKnUA8vSvoMtoypRRJ9Sqtx\\nGg+trlu8N1CEKzLhKym+Q7+5lRdeaVF5BYmTXXEePLD5pO73CRkDci0sAjlIEorG\\nk/Dt/tIR5LGgtj1Oc57jPCmo9lI/8Cm+5B1PL9lRSjb+m8ESMPby7+6/HPcMMxyF\\nzGVKz2ApHmbLZQpWnaQ2T9RQX90CxkI2wj3I9NSFKWeDR5SXSiVr6EwuN7aX6Rqg\\nJWlDhhWlyweZiJJ/P1FRhx8aeYEgAEwo9F6RnWEyHFWCAaaDQcOPM5C55iG09IVU\\nKltdH9SHAgMBAAECggEAVynFrL0CNgVtM8OzImniltfabwslFP/RW2CwxLXjtW3a\\nSuzR1AL1LM6MTCTwEtka2ulBhLX2J68/KvgeCYa1tES8N8/nMWXLtUpA9LbV6Ed1\\nC/1/F568O4+EtchVqkzOpwqgtpqhg1MuUFzm+2oiM6x3XUey8GYa4RbUhn+I7jDB\\nxRrEAH/iOL4HSego+eT9IFqoVj82tnhjy0kNdUlOgHTzCoHkk9a/godrZUY+5OLP\\nfzYG1ZkL72GLPT1oXtsxR9NJW8BVUtsE5JhNgA1fz7pFqtVPcVZYi18xw22z9DZM\\nmNDUyELpu7lvMdY9TcqHsH1guj0xEuWBqp8DwClt6QKBgQDnfvWVyDbUjRfCJllp\\nNXYDFqWFE3b99GO29yMihPnY72uFe5mPypSA4x4AANHa5WtyLUXmz7DnMN4xmd5B\\nUWbgx9PDeSz3d9HWtXOQa1pcy9tpLv+wDbxS39nvJWt8jqDfIy7jEpBbt8AASo+e\\nGSRHo+NqLAodtwLAGz4MvO1TXwKBgQDILt3xUslPyPxG/FbxDpXlEqREwnwDBF82\\nNzsNK9NU23HhF8+8robxWaLxDTGhcA8wgosVbq10DZPwBVZYaPtM04Rh+FMvmks2\\nFIEuBrFLXXZTnVbIsojZFq1q3VvOC33AbwO8hlm4bt44wYcXc15mYF/9BYbO5C29\\ntY6V0a132QKBgEAiS63030wRIrMotXqVPt1\\n1cLqDT7K4GkrYhGPa1R5vrpSkLwfkh8b1PTxDYbqLwa2o4AyydkVs1TGaN8QvM1m\\nYk/2GcIfd7OO5vo52IqER4Dqf9q1sBRbK/OvNjKpPFmb7nD7CjrJ0e/HULiU8eT+\\npuDrTragpkBs8RssdKEbRVw=\\n-----END PRIVATE KEY-----\\n",
    "QSTASH_TOKEN": "eyJVc2VySUQiOiI0YTNjMDM2NS1hNGY5LTQ2ZjQtOTAwNC01ODRiOGZkYjc4NTEiLCJQYXNzd29yZCI6ImUzZmM2ZGFmNDAxMDRiZTdhY2U0YmZhODI0ZTI1MGIzIn0=",
    "QSTASH_URL": "https://qstash-us-east-1.upstash.io",
    "APP_URL": "https://med-check-v2.vercel.app",
    "DATABASE_URL": "postgresql://postgres.xdoxnzkviobclwkjkwao:ga30134107$$@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres",
    "NEXT_PUBLIC_SUPABASE_URL": "https://xdoxnzkviobclwkjkwao.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_PiyPjUFu-qFE-8VYljLXDQ_RLKQnhgF"
}

for key, val in envs.items():
    print(f"Processing {key}...")
    for target in targets:
        # Remove existing
        try:
            rm_cmd = ["npx.cmd", "vercel", "env", "rm", key, target, "--token", token]
            subprocess.run(rm_cmd, input=b"y\n", check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

        # Add new
        add_cmd = ["npx.cmd", "vercel", "env", "add", key, target, "--token", token]
        try:
             # Vercel CLI reads value from stdin
            result = subprocess.run(add_cmd, input=val.encode('utf-8'), capture_output=True, check=True)
            print(f"  [OK] Added to {target}")
        except subprocess.CalledProcessError as e:
            print(f"  [ERR] Failed to add {key} to {target}: {e.stderr.decode()}")
