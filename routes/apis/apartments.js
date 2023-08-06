const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: 'root',
    database: 'apartment_management_system'
})
db.commit();
// Get all apartments
router.get('/apartments/', (req, res) => {
    const sql = "select * from apartments"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "Something went wrong in featching apartments" });
        res.json(result);
    })
});

// register a new apartment
router.post('/apartments/registration', (req, res) => {
    const { name, location, price, flores, flats } = req.body;

    if (!name || !location || !price || !flores || !flats) {
        return res.status(400).json({ error: 'Name, location, price,flats and flores are required fields.' });
    }

    const sql = `insert into apartments values("${uuidv4()}","${name}","${location}",${price},${flores},${flats})`
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "Something went wrong in registering" });
        if (result) {
            res.json({ messege: "The apartment registered successfully!" })
        }
    })
});

//returns apartment details by taking id 
router.get('/apartments/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Apartment id is required' });
    }

    const sql = "select * from apartments";
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "Something went wrong" });

        const apartments = result;
        const apartment = apartments.find((apt) => apt.id === id);

        if (!apartment) {
            return res.status(400).json({ error: 'Apartment not found' })
        }
        res.json(apartment);
    });
});

module.exports = router;