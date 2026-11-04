
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGO_URI);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

let projects;

// Helper: clean optional project fields
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

// READ: Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const records = await projects.find({}).toArray();
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch projects' });
    }
});

// CREATE: Add project
app.post('/api/projects', async (req, res) => {
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

// UPDATE: Edit project
app.put('/api/projects/:id', async (req, res) => {
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

// DELETE: Remove project
app.delete('/api/projects/:id', async (req, res) => {
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

// SEARCH: Find projects by category
app.get('/api/projects/search/:category', async (req, res) => {
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

async function startServer() {
    try {
        await client.connect();

        const db = client.db('EliteArchitectureDB');
        projects = db.collection('Projects');

        app.listen(process.env.PORT || 5000, () => {
            console.log('Elite Architectural Firm backend running on port 5000');
            console.log('MongoDB connected successfully');
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();
