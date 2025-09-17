import random
import string

# TODO: ensure that the game code is unique
def generate_code():
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(chars) for _ in range(4))
    return code