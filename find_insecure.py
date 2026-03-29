import os
import glob

api_dir = 'app/api'
insecure = []

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                if 'validateAuthSession' not in content and 'auth_token' not in content and 'cookies()' not in content and 'authHeader' not in content:
                    insecure.append(filepath)

print('\n'.join(insecure))
