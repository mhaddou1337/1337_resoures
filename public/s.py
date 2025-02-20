import json
import random
import string

# Load the JSON file
def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# Save the JSON file
def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Generate an easy password
def generate_password(first_name):
    random_digits = ''.join(random.choices(string.digits, k=4))
    return f"{first_name}{random_digits}"

# Add passwords to each user
def add_passwords(data):
    for user in data:
        if 'first_name' in user and user['first_name']:
            user['password'] = generate_password(user['first_name'])
    return data

# Main execution
file_path = "data.json"  # Modify to update the same file
data = load_json(file_path)
data_with_passwords = add_passwords(data)
save_json(data_with_passwords, file_path)

print(f"Passwords added and saved to {file_path}")
