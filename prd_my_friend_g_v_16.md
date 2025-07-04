## My Friend Glu – Product Requirements Document (v1.6)

### Overview

My Friend Glu is a mobile application specifically designed to help expecting mothers manage gestational diabetes through simplified meal tracking. Our primary user is Mato, an expecting mom diagnosed with gestational diabetes who needs to closely track her meals (three main meals and three snacks daily) to ensure her glucose remains stable for her baby's health. Mato currently uses continuous glucose monitors (CGMs) like Dexcom, but existing meal logging solutions are tedious and not culturally attuned to her diet, making accurate logging difficult.

My Friend Glu solves this by offering an intuitive, conversational AI-based interface that simplifies meal logging, estimates carbohydrate intake intelligently, and provides actionable insights based on dietary intake, significantly reducing Mato's daily burden.

### Goals

- Simplify the logging of frequent meals and snacks for gestational diabetes management.
- Accurately estimate carbohydrates and sugar intake from complex or culturally diverse meals.
- Provide actionable feedback to help manage carbohydrate intake.
- Encourage consistent usage through frictionless conversational logging.

### Non-Goals

- Providing direct medical advice or insulin dosage recommendations.
- Direct integration with CGMs or insulin pumps in the MVP.
- Offline functionality for AI-driven features.
- Manual glucose logging.

### Target Persona: Mato

- Pregnant woman recently diagnosed with gestational diabetes.
- Eats six times a day (3 meals, 3 snacks) per doctor's advice.
- Uses CGMs (e.g., Dexcom) to continuously monitor blood glucose.
- Finds current apps tedious; struggles to estimate portion sizes, especially in complex, culturally-specific meals.
- Needs a simple, low-effort way to log meals accurately.

### Key Features

1. **Conversational Meal Logging**
   - Single intuitive conversational (text/voice) interface for logging meals, clarification interactions, and meal summaries.
   - Natural language processing to interpret detailed meal descriptions and provide structured summaries.
   - Real-time clarifying follow-up questions to ensure accurate carbohydrate estimation.
   - AI provides conversational summaries and actionable recommendations directly in the conversational interface.

2. **Intelligent Carbohydrate Estimation**
   - AI estimates total carbohydrate and sugar content from conversational input.
   - Handles culturally diverse meals and mixed dishes effectively.

3. **Integrated Timeline and Home Screen**
   - Single screen combining quick navigation buttons for logging meals/snacks and a historical timeline view.
   - Timeline visualization showing historical meal data, including timestamps, meal types (snack, breakfast, lunch, dinner), and total carbohydrate numbers.
   - Ability to filter and scroll through historical logs by date.

### User Flow: Conversational Meal Logging (Simplified)

1. **Open App**: Mato logs in and sees the integrated home/timeline screen.
2. **Initiate Logging**: Taps "Log Meal" or "Log Snack" button.
3. **Conversational Interface**: App launches conversational interface, prompting Mato:
   - "Hi Mato, what did you eat?"
   - Mato describes the meal naturally.
   - AI asks clarifying questions if necessary.
   - AI provides structured meal summary and carbohydrate estimation in text and voice:
     - Example: "Meal logged: Half plate Kung Pao chicken, 1 bok choy, 1 small bowl of rice, spicy and sour soup. Your meal contains around 55 grams of carbohydrates—slightly high. A gentle walk could help balance your glucose."
4. **Save & Review Timeline**:
   - Meal saved and immediately viewable on the home screen timeline.

### UX Requirements

- Minimalistic design prioritizing clarity and ease of use.
- Intuitive conversational interface with clear prompts and feedback.
- Accessible design to accommodate varying levels of technical proficiency.
- Quick and simple navigation with immediate access to primary functions.
- Smooth, responsive interaction with AI to maintain conversational flow.

### Engineering Requirements

**API Design**
- RESTful endpoints for conversational input processing.
- Secure user authentication and session management.
- Endpoints for meal logging and historical data retrieval.

**Mobile UI Behavior**
- Responsive UI optimized for conversational interactions.
- Easy navigation from the integrated home screen to logging features.
- Intuitive timeline visualization with clear data presentation.

**AI Backend Specifications**
- NLP model for interpreting user input.
- Carbohydrate estimation model trained on diverse meal data.
- Real-time conversational responses and clarifying questions.
- Cloud-based AI service integration for scalability and performance.

### Future Considerations

- Direct integration with CGM data sources.
- Offline capabilities for AI components.
- Potential addition of manual glucose logging.

### Next Steps

- Conduct UX testing with gestational diabetes patients.
- Refine AI nutritional analysis with nutrition experts.
- Prioritize rapid logging efficiency for frequent use cases.

