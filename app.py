from flask import Flask, render_template,jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import os


load_dotenv()


app = Flask(__name__)

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

model = genai.GenerativeModel('gemini-1.5-flash')


@app.route('/')
def intro():
    return render_template('home.html')

@app.route('/login')
def login():
    api_key = os.getenv('FIREBASE_API_KEY')
    return render_template("login.html", api_key=api_key)

@app.route('/signup')
def signup():
    api_key = os.getenv('FIREBASE_API_KEY')
    return render_template("signup.html", api_key=api_key)

@app.route('/dashboard')
def dashboard():
    api_key = os.getenv('FIREBASE_API_KEY')
    return render_template("dashboard.html", api_key=api_key)

@app.route('/yoga')
def yoga():
    return render_template("Yoga.html")

@app.route('/workout')
def Workout():
    return render_template("Workout.html")

@app.route('/HomeWorkout')
def HomeWorkout():
    return render_template("HomeWorkout.html")

@app.route('/GymWorkout')
def GymWorkout():
    return render_template("GymWorkout.html")

@app.route('/api/ai-suggestions/<user_mood>')
def ai_suggestion(user_mood):
    try:
        prompt = f"""Give me a motivational quote and five actionable, practical mental health tips for someone feeling {user_mood} today. 
Each tip should be simple, direct, and easy to follow.
Please provide the response in the following format:
Quote: "Your motivational quote here."

1. First tip
2. Second tip
3. Third tip
4. Fourth tip
5. Fifth tip"""

        response = model.generate_content(prompt)

        suggestion = response.text.strip()

        return jsonify({'suggestion': suggestion})

    except Exception as e:
        print(f"❌ Error fetching AI suggestion: {e}")
        return jsonify({'suggestion': 'Unable to fetch suggestion right now.'})




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)