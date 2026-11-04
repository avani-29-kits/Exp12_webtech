
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

let client;
let projects = null;

function getOptionalFields(body) {
    const fields = {};

    ['imageUrl', 'location', 'description', 'year'].forEach(field => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            fields[field] = typeof body[field] === 'string'
                ? body[field].trim()
                : '';
        }
    });

    return fields;
}

function requireDatabase(req, res, next) {
    if (!projects) {
        return res.status(503).json({
            error: 'Database is not connected. MongoDB Atlas setup is required.'
        });
    }
    next();
}

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Elite Architectural Firm API is running',
        database: projects ? 'connected' : 'not connected'
    });
});

// READ
app.get('/api/projects', requireDatabase, async (req, res) => {
    try {
        res.json(await projects.find({}).toArray());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch projects' });
    }
});

// CREATE
app.post('/api/projects', requireDatabase, async (req, res) => {
    try {
        const { name, category } = req.body;

        if (typeof name !== 'string' || !name.trim() ||
            typeof category !== 'string' || !category.trim()) {
            return res.status(400).json({
                error: 'Project name and category are required'
            });
        }

        const project = {
            name: name.trim(),
            category: category.trim(),
            ...getOptionalFields(req.body)
        };

        const result = await projects.insertOne(project);

        res.status(201).json({
            _id: result.insertedId,
            ...project,
            message: 'Project added successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to add project' });
    }
});

// UPDATE
app.put('/api/projects/:id', requireDatabase, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        if (typeof name !== 'string' || !name.trim() ||
            typeof category !== 'string' || !category.trim()) {
            return res.status(400).json({
                error: 'Project name and category are required'
            });
        }

        const updateFields = {
            name: name.trim(),
            category: category.trim(),
            ...getOptionalFields(req.body)
        };

        const result = await projects.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (!result.matchedCount) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to update project' });
    }
});

// DELETE
app.delete('/api/projects/:id', requireDatabase, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const result = await projects.deleteOne({
            _id: new ObjectId(id)
        });

        if (!result.deletedCount) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to delete project' });
    }
});

// SEARCH
app.get('/api/projects/search/:category', requireDatabase, async (req, res) => {
    try {
        const category = req.params.category;

        const records = await projects.find({
            category: { $regex: category, $options: 'i' }
        }).toArray();

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to search projects' });
    }
});

// Start server even if MongoDB is unavailable
async function startServer() {
    if (process.env.MONGO_URI) {
        try {
            client = new MongoClient(process.env.MONGO_URI);
            await client.connect();

            const db = client.db('EliteArchitectureDB');
            projects = db.collection('Projects');

            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection failed:', error.message);
            console.log('Starting API without database access.');
        }
    } else {
        console.log('MONGO_URI not configured. Starting without database.');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Elite Architectural Firm backend running on port ${PORT}`);
    });
}

startServer();
