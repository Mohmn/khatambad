**Modelling non-trivial DB Schemas** 

Let’s see a few data models which are not overly complex, has only 3-4 entities, but still not trivial to implement properly 

1. Basic E-commerce 

Users (can be customers or sellers)
Products (belong by sellers) 
Carts (belongs to users can have multiple products)
Orders (when you checkout a cart) 


2. Task+Notes 

Users 
Tasks (created by a user, assigned to a user, can depend on other tasks) 
Notes (belong to a task, written by a user) 

3. Social Media 

Users (can follow other users) 
Posts (can be reply to other posts, can be liked by users) 
Messages (between 2 or more users) 

——- 

Try to implement this data model in a SQL db (like Postgres) and also in a noSQL db (like MongoDB) both. Yes I did say *both* 

Either in DB or in code (you figure it out) handle constraints like 

- cannot checkout if product quantity is 0 
- remove all posts by a user if their account is deleted
- cannot mark task complete unless dependant tasks are completed (and vice versa) 

——- 

After writing the SQL commands or creating these collections in Mongo you’ll think your work is done. It isn’t 

The most important thing starts now

Generate some large amount of data 

10k users 
100k posts (distribute to users well, some should be replies etc) 
make all users follow 50-100 users etc 

Generate 100k products, make 10k carts add products of 1-5 qty in them 

There’s genAI, there’s mockaroo, there’s json-generator and bunch of websites than can generate tons of random data for you

Generate the data, populate the DB

Now do you all your queries like 
- find all posts of followed users 
- find total sales volume per day from orders 
- show tasks completed per day 

See how long they are taking? At this scale of data on a MacBook sized machine if it is not <10ms, then you’ve not created correct index or not made proper relationships or not normalised data correctly 
Figure out what’s wrong 
A high end laptop can handle these queries of this size of data in single digit milliseconds



Thanks for sharing that. Here are some strategies to help you overcome procrastination when feeling overwhelmed and distracted by your mobile phone:

Dealing with Feeling Overwhelmed
Break Tasks into Smaller Steps:

Divide large tasks into smaller, manageable steps.
Focus on completing one step at a time, which can make the task feel less daunting.
Prioritize Tasks:

Use a prioritization method like the Eisenhower Matrix to categorize tasks based on urgency and importance.
Tackle high-priority tasks first to create a sense of accomplishment.
Set Clear Goals:

Define specific, achievable goals for each work session.
Use the SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound) to set effective goals.
Use Time Management Techniques:

Try techniques like the Pomodoro Technique (working in focused intervals with short breaks).
Schedule your day with dedicated time blocks for different tasks.
Reducing Mobile Phone Distractions
Create a Distraction-Free Environment:

Set up a dedicated workspace with minimal distractions.
Use tools like noise-canceling headphones if you work in a noisy environment.
Limit Phone Usage:

Put your phone on silent or use the "Do Not Disturb" mode during work hours.
Keep your phone out of reach or in another room while working.
Use Apps to Stay Focused:

Use productivity apps like Forest or Focus@Will that encourage you to stay off your phone.
Install apps that block distracting websites and apps during work hours (e.g., Freedom, Cold Turkey).
Set Specific Times for Phone Use:

Schedule specific times to check your phone, such as during breaks.
Avoid checking your phone first thing in the morning or right before bed.
General Tips
Establish a Routine:

Create a daily routine that includes set times for work, breaks, and leisure.
Consistency can help reduce the feeling of being overwhelmed.
Practice Mindfulness and Relaxation:

Engage in mindfulness practices like meditation or deep breathing to reduce stress.
Take regular breaks to relax and recharge.
Seek Support:

Talk to colleagues or friends about your challenges.
Consider accountability partners or joining productivity groups for mutual support.