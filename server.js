const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
let users = [
    {
        id: 1,
        username: 'Srushti_Tambvekar',
        email: 'srushti@example.com',
        password: 'password123',
        reputation: 150,
        createdAt: new Date('2024-01-01')
    },
    {
        id: 2,
        username: 'Chaitali',
        email: 'jane@example.com',
        password: 'password123',
        reputation: 89,
        createdAt: new Date('2024-01-15')
    },
    {
        id: 3,
        username: 'Shravani',
        email: 'sql@example.com',
        password: 'password123',
        reputation: 250,
        createdAt: new Date('2024-01-10')
    }
];

let questions = [
    {
        id: 1,
        title: "How to join 2 columns in a data set to make a separate column in SQL",
        description: "I do not know the code for it as I am a beginner. As an example what I need to do is like there is a column 1 containing First name, and column 2 consists of last name I want a column to combine both first name and last name into a single column called Full Name. Can someone help me with the SQL syntax?",
        tags: ["SQL", "Database", "Beginner"],
        authorId: 1,
        views: 124,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        accepted: true
    },
    {
        id: 2,
        title: "How to implement responsive design with CSS Grid",
        description: "I am trying to create a responsive layout using CSS Grid but I am having trouble with the grid-template-areas property. Can someone explain how to make it work properly across different screen sizes? I want to reorganize my layout on mobile devices.",
        tags: ["CSS", "Grid", "Responsive"],
        authorId: 2,
        views: 89,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        accepted: false
    },
    {
        id: 3,
        title: "JavaScript async/await vs Promises - which one to use?",
        description: "I am confused about when to use async/await and when to use traditional Promises. What are the pros and cons of each approach? Are there specific scenarios where one is better than the other?",
        tags: ["JavaScript", "Async", "Promises"],
        authorId: 1,
        views: 156,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        accepted: false
    }
];

let answers = [
    {
        id: 1,
        questionId: 1,
        content: "You can use the CONCAT function in SQL. Here's how:\n\n```sql\nSELECT CONCAT(first_name, ' ', last_name) AS full_name \nFROM your_table;\n```",
        authorId: 2,
        accepted: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
        id: 2,
        questionId: 1,
        content: "Another approach is to use the CONCAT_WS function:\n\n```sql\nSELECT CONCAT_WS(' ', first_name, last_name) AS full_name \nFROM your_table;\n```",
        authorId: 3,
        accepted: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
        id: 3,
        questionId: 2,
        content: "Use media queries with grid-template-areas. Here's an example:\n\n```css\n.container {\n  display: grid;\n  grid-template-areas: \n    'header header'\n    'sidebar main'\n    'footer footer';\n}\n```",
        authorId: 1,
        accepted: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
];

// Helper functions
function getUserById(id) {
    return users.find(user => user.id === parseInt(id));
}

function getQuestionById(id) {
    return questions.find(question => question.id === parseInt(id));
}

function getAnswersForQuestion(questionId) {
    return answers.filter(answer => answer.questionId === parseInt(questionId));
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/questions', (req, res) => {
    const questionsWithDetails = questions.map(question => {
        const author = getUserById(question.authorId);
        const questionAnswers = getAnswersForQuestion(question.id);
        
        return {
            ...question,
            author: author ? { username: author.username } : null,
            answerCount: questionAnswers.length,
            timestamp: formatTimeAgo(question.createdAt)
        };
    });
    
    res.json({ questions: questionsWithDetails });
});

app.post('/api/questions', (req, res) => {
    const { title, description, tags } = req.body;
    
    const newQuestion = {
        id: questions.length + 1,
        title,
        description,
        tags,
        authorId: 1,
        views: 0,
        createdAt: new Date(),
        accepted: false
    };
    
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
});

app.delete('/api/questions/:id', (req, res) => {
    const questionId = parseInt(req.params.id);
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
        return res.status(404).json({ error: 'Question not found' });
    }
    
    questions.splice(questionIndex, 1);
    answers = answers.filter(answer => answer.questionId !== questionId);
    
    res.json({ success: true });
});

app.post('/api/questions/:id/answers', (req, res) => {
    const questionId = parseInt(req.params.id);
    const { content } = req.body;
    
    const newAnswer = {
        id: answers.length + 1,
        questionId,
        content,
        authorId: 1,
        accepted: false,
        createdAt: new Date()
    };
    
    answers.push(newAnswer);
    res.status(201).json(newAnswer);
});

app.delete('/api/answers/:id', (req, res) => {
    const answerId = parseInt(req.params.id);
    const answerIndex = answers.findIndex(a => a.id === answerId);
    
    if (answerIndex === -1) {
        return res.status(404).json({ error: 'Answer not found' });
    }
    
    answers.splice(answerIndex, 1);
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`StackIt server running on port ${PORT}`);
});
