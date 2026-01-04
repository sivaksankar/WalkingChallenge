#!/usr/bin/env python3
"""Set IAM policy to allow unauthenticated access to Cloud Function."""

import subprocess
import sys

def set_function_public():
    """Make nextServer Cloud Function publicly accessible."""
    project_id = "walking-challenge-cd6dd"
    region = "us-central1"
    function_name = "nextServer"
    
    # The resource name format for Cloud Functions 2nd Gen
    resource = f"projects/{project_id}/locations/{region}/functions/{function_name}"
    
    # Command to add allUsers to roles/cloudfunctions.invoker
    cmd = [
        "npx", "@google-cloud/gax",
        "iam", "set-policy",
        resource,
        "--member=allUsers",
        "--role=roles/cloudfunctions.invoker"
    ]
    
    print(f"Setting IAM policy for {resource}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ IAM policy set successfully")
            print(result.stdout)
        else:
            print("❌ Error setting IAM policy:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = set_function_public()
    sys.exit(0 if success else 1)
