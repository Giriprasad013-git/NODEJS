const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { format } = require('date-fns')
const router = express.Router();
const path = require('path')

const bodyParser = require('body-parser');
router.use(bodyParser.json());
const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: 'root',
    database: 'apartment_management_system'
})
db.commit();


//returns flat details by taking flat id
router.get('/apartments/floors/flats/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "id is mandatory to find the flat details" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) res.status(400).json({ error: "somthing went wrong in reading flats" });
        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "The flat not found" });
        }
        res.json(flatt);
    })
})

//used to book the flats 
router.post('/apartments/floors/flats/reservation/', (req, res) => {
    const { username, mobilenum, status, apartmentid, floor } = req.body;
    if (!username || !mobilenum || !status || !apartmentid || !floor) {
        return res.json({ error: 'apartmentid,username ,floor,mobilenum and status are the required fields' });
    }

    const sql = "select * from apartments";
    db.query(sql, (err, result1) => {
        if (err) res.status(400).json({ error: "somthing went wrong in reading apartments" });

        const Apartmentid = result1.find((apt) => apt.id === apartmentid);
        const ApartmentFloors = result1.find((apt) => apt.floors >= floor + 1)

        if (!ApartmentFloors) {
            return res.json({ error: 'Apartment floor not found with this apartment id' })
        }
        if (!Apartmentid) {
            return res.json({ error: 'Apartment not found with this apartment id' })
        }
    });
    const sql2 = `insert into flats values("${uuidv4()}","${apartmentid}","${username}",${mobilenum}, "${status}", "${format(new Date(), 'yyyy-MM-dd')}",${floor}, "${format(new Date(), 'yyyy-MM-dd')}",0,"${format(new Date(), 'yyyy-MM-dd')}",0,"${format(new Date(), 'yyyy-MM-dd')}",0)`;
    db.query(sql2, (err, result2) => {
        if (err) res.json({ error: "Flat registration failed" });
        if (result2) {
            res.status(201).json({ message: "Flat registered successfully" });
        } else {
            res.json({ message: "Flat not registered" });
        }
    })
});

//returns the status of the flat
router.get('/apartments/floors/flats/status/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "flat id is required" })
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthingwent wrong in readin flats data" })
        const flatt = result.find((flt) => flt.id === id);
        if (!flatt) {
            return res.status(400).json({ error: "flat not found!" });
        }
        res.json(flatt.status);
    })
});

//allbill getting
router.get('/apartments/floors/flats/allbills/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "flat id not found" });
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthingwent wrong in readin flats data" })

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" })
        }
        res.json({ Gasbill: `${flatt.gasbill}`, MaintenenceBill: `${flatt.maintenencebill}`, GarbageCollectionBill: `${flatt.garbagecollectionbill}` })
    })
})

//returns gas bill for flat id
router.get('/apartments/floors/flats/gasbill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthingwent wrong in readin flats data" })

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        res.json({ GassBill: `${flatt.gasbill}` })
    })
})

//used to pay gasbill
router.put('/apartments/floors/flats/paygasbill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const { gasBill } = req.body;
    if (!gasBill) {
        return res.status(400).json({ error: "gasBill should be entered" })
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthingwent wrong in readin flats data1" })

        const flat = result.find((flt) => flt.id === id);

        if (!flat) {
            return res.status(400).json({ error: "flat not found" });
        }

        var bill = flat.gasbill - gasBill;
        addgasPaymentsData(id, gasBill);

        const sql2 = `update flats set gasbill=${bill},lastGasbillpaidon = "${format(new Date(), 'yyyy-MM-dd')}" where flats.id="${id}"`
        db.query(sql2, (err, responce) => {
            if (err) return res.json({ message: 'somthing went wrong in updating flats table' });
            if (responce) {
                return res.status(200).json({ message: 'gas bills updated successfully' });
            }
        })

    })
});

//function to add gas payments data
function addgasPaymentsData(id, gasBill) {
    const sql = `insert into billpayments values ("${format(new Date(), 'yyyy-MM-dd')}","${id}","gasbill",${gasBill})`
    db.query(sql, (err, result) => {
        if (err) return res.json({ error: "somthingwent wrong in inserting billpayments data" })
    })

}

//function to add maintenence payment data
function addmaintenencePaymentsData(id, Bill) {
    const sql = `insert into billpayments values ("${format(new Date(), 'yyyy-MM-dd')}","${id}","maintenencebill",${gasBill})`
    db.query(sql, (err, result) => {
        if (err) return res.json({ error: "somthingwent wrong in inserting billpayments data" })
    })
}

//function to add garbage collection payments data
function addgarbagePaymentsData(id, Bill) {
    const sql = `insert into billpayments values ("${format(new Date(), 'yyyy-MM-dd')}","${id}","garbagebill",${gasBill})`
    db.query(sql, (err, result) => {
        if (err) return res.json({ error: "somthingwent wrong in inserting billpayments data" })
    })
}


//function to add all payments data
function addAllPaymentsData(id, gasBill, garbageBill, maintenenceBill) {
    addgarbagePaymentsData(id, garbageBill);
    addgasPaymentsData(id, gasBill);
    addmaintenencePaymentsData(id, maintenenceBill);
}


//returns gasbilldue
router.get('/apartments/floors/flats/gasbilldues/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "somthing went wrong in reading flats table" });

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        if (flatt.gasbill > 0) {
            res.json({ GasBillDue: `${flatt.gasbill}` })
        }
    })
});

//returns flots with maintenence bill due
router.get('/apartments/floors/flats/maintenencedues/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "somthing went wrong in reading flats table" });

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        if (flatt.maintenencebill > 0) {
            res.json({ maintenenceBillDue: `${flatt.maintenencebill}` })
        }

    })
});
//returns garbage bill due
router.get('/apartments/floors/flats/garbagedues/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "somthing went wrong in reading flats table" });

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        if (flatt.garbagecollectionbill > 0) {
            res.json({ GarbageBillDue: `${flatt.garbagecollectionbill}` })
        }

    })
});


//used to pay maintenence bill
router.put('/apartments/floors/flats/paymaintenencebill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const { maintenenceBill } = req.body;
    if (!maintenenceBill) {
        return res.status(400).json({ error: "maintenenceBill should be entered" })
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthing went wrong in reading flats data" })

        const flat = result.find((flt) => flt.id === id);

        if (!flat) {
            return res.status(400).json({ error: "flat not found" });
        }

        var bill = flat.maintenencebill - maintenenceBill;
        addmaintenencePaymentsData(id, maintenenceBill);

        const sql2 = `update flats set maintenencebill=${bill},lastmaintenencebillpaidon ="${format(new Date(), 'yyyy-MM-dd')}" where flats.id="${id}"`
        db.query(sql2, (err, responce) => {
            if (err) return res.status(200).json({ message: 'somthing went wrong in updating flats table' });
            if (responce) {
                return res.status(200).json({ message: 'maintenence bills updated successfully' });
            }
        })

    })
});

//used to pay all bills at ones
router.put('/apartments/floors/flats/payallbill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const { maintenenceBill, gasBill, garbageBill } = req.body;
    if (!maintenenceBill || !gasBill || !garbageBill) {
        return res.status(400).json({ error: "All Bills should be entered" })
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthing went wrong in reading flats data" })

        const flat = result.find((flt) => flt.id === id);

        if (!flat) {
            return res.status(400).json({ error: "flat not found" });
        }

        var Mbill = flat.maintenencebill - maintenenceBill;
        var gasbill = flat.gasbill - gasBill;
        var garbill = flat.garbagecollectionbill - garbageBill;
        addAllPaymentsData(id, gasBill, garbageBill, maintenenceBill);

        const sql2 = `update flats set maintenencebill=${Mbill},lastmaintenencebillpaidon ="${format(new Date(), 'yyyy-MM-dd')}",gasbill=${gasbill},lastGasbillpaidon ="${format(new Date(), 'yyyy-MM-dd')}",garbagecollectionbill=${garbill},lastGarbagebillpaidon ="${format(new Date(), 'yyyy-MM-dd')}" where flats.id="${id}"`
        db.query(sql2, (err, responce) => {
            if (err) return res.status(200).json({ message: 'somthing went wrong in updating flats table' });
            if (responce) {
                return res.status(200).json({ message: 'All bills updated successfully' });
            }
        })

    })
});


//used to pay garbage bill
router.put('/apartments/floors/flats/paygarbagebill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const { garbageBill } = req.body;
    if (!garbageBill) {
        return res.status(400).json({ error: "garbageBill should be entered" })
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthing went wrong in reading flats data" })

        const flat = result.find((flt) => flt.id === id);

        if (!flat) {
            return res.status(400).json({ error: "flat not found" });
        }

        var bill = flat.garbagecollectionbill - garbageBill;
        addgarbagePaymentsData(id, garbageBill);

        const sql2 = `update flats set garbagecollectionbill=${bill},lastGarbagebillpaidon ="${format(new Date(), 'yyyy-MM-dd')}" where flats.id="${id}"`
        db.query(sql2, (err, responce) => {
            if (err) return res.status(200).json({ message: 'somthing went wrong in updating flats table' });
            if (responce) {
                return res.status(200).json({ message: 'garbage bills updated successfully' });
            }
        })

    })
});

//returns maintenencebill
router.get('/apartments/floors/flats/maintenencebill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthing went wrong in reading flats data" })

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        res.json({ maintenenceBill: `${flatt.maintenencebill}` })
    })
})

//returns garbagebill
router.get('/apartments/floors/flats/garbagebill/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats"
    db.query(sql, (err, result) => {
        if (err) res.json({ error: "somthing went wrong in reading flats data" })

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        res.json({ GarbageBill: `${flatt.garbagecollectionbill}` })
    })
})


//returns billdue per flat id
router.get('/apartments/floors/flats/billdues/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "Id not found" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "somthing went wrong in reading flats table" });

        const flatt = result.find((flt) => flt.id === id);

        if (!flatt) {
            return res.status(400).json({ error: "flat not found" });
        }
        if (flatt.gasbill > 0 || flatt.garbagecollectionbill > 0 || flatt.maintenencebill) {
            res.json({ GasBillDue: `${flatt.gasbill}`, MaintenenceBill: `${flatt.maintenencebill}`, GarbageBill: `${flatt.garbagecollectionbill}` })
        }
    })
});


//returns billdue per floor
router.get('/apartments/floors/:id/billduesperfloor/:floor', (req, res) => {
    const { id, floor } = req.params
    if (!floor) {
        return res.status(400).json({ error: "floor not found" });
    }
    if (!id) {
        return res.status(400).json({ error: "apartment not found" });
    }
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "somthing went wrong in reading flats table" });

        const flatt = result.filter((flt) => (flt.floor === floor && flt.apartmentid === id) && (flt.gasbill > 0 || flt.maintenencebill > 0 || flt.garbagecollectionbill > 0));

        if (!flatt) {
            return res.status(400).json({ error: "flats not found" });
        }
        res.json(flatt);
    })
});




module.exports = router;