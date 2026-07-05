const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shortlink_db',
  waitForConnections: true,
  connectionLimit: 10,
})

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        shortlink_id INT UNSIGNED NOT NULL,
        clicked_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY idx_clicked_at (clicked_at),
        KEY idx_shortlink_id (shortlink_id),
        FOREIGN KEY (shortlink_id) REFERENCES shortlinks (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('Database clicks table initialized successfully.')
  } catch (err) {
    console.error('Failed to initialize clicks table:', err)
  }
}
initializeDatabase()

function generateCode(length = 9) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token || token !== 'dummy-admin-token') {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' })
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, email, password FROM users WHERE email = ? LIMIT 1',
      [email],
    )
    console.log(rows)
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }
    return res.json({ token: 'dummy-admin-token' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/links', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const offset = (page - 1) * limit

  try {
    const [rows] = await pool.query(
      'SELECT * FROM shortlinks ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset],
    )
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM shortlinks',
    )
    const totalPages = Math.ceil(total / limit) || 1
    res.json({
      data: rows,
      page,
      total,
      totalPages,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/links-stats', authMiddleware, async (req, res) => {
  try {
    const [[linkRow]] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM shortlinks',
    )
    const [[clickRow]] = await pool.query(
      'SELECT COUNT(*) AS totalClicks FROM clicks',
    )
    const [[todayRow]] = await pool.query(
      'SELECT COUNT(*) AS clicksToday FROM clicks WHERE clicked_at >= CURDATE()',
    )
    const [[liveRow]] = await pool.query(
      'SELECT COUNT(*) AS liveTraffic FROM clicks WHERE clicked_at >= NOW() - INTERVAL 30 MINUTE',
    )

    res.json({
      total: linkRow.total || 0,
      active: linkRow.active || 0,
      totalClicks: clickRow.totalClicks || 0,
      clicksToday: todayRow.clicksToday || 0,
      liveTraffic: liveRow.liveTraffic || 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/clicks-trend', authMiddleware, async (req, res) => {
  const { range } = req.query
  try {
    let daysLimit = 7

    if (range === 'today') {
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(clicked_at, '%Y-%m-%d %H:00') AS label, COUNT(*) AS clicks
         FROM clicks
         WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         GROUP BY DATE_FORMAT(clicked_at, '%Y-%m-%d %H:00')
         ORDER BY label ASC`
      )
      
      const data = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const date = String(d.getDate()).padStart(2, '0')
        const hour = String(d.getHours()).padStart(2, '0')
        const key = `${year}-${month}-${date} ${hour}:00`
        const displayLabel = `${hour}:00`
        
        const found = rows.find(r => r.label === key)
        data.push({
          label: displayLabel,
          clicks: found ? found.clicks : 0
        })
      }
      return res.json(data)
    } else if (range === '30d') {
      daysLimit = 30
    } else if (range === 'all') {
      const [[minDateRow]] = await pool.query('SELECT MIN(clicked_at) AS min_date FROM clicks')
      const minDate = minDateRow.min_date ? new Date(minDateRow.min_date) : new Date()
      const diffTime = Math.abs(new Date() - minDate)
      daysLimit = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
      if (daysLimit < 7) daysLimit = 7
    } else {
      daysLimit = 7
    }

    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(clicked_at, '%Y-%m-%d') AS label, COUNT(*) AS clicks
       FROM clicks
       WHERE clicked_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(clicked_at)
       ORDER BY label ASC`,
      [daysLimit - 1]
    )

    const data = []
    const now = new Date()
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      const key = `${year}-${month}-${date}`
      const displayLabel = `${date}-${month}-${year}`

      const found = rows.find(r => r.label === key)
      data.push({
        label: displayLabel,
        clicks: found ? found.clicks : 0
      })
    }
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/links/:code', async (req, res) => {
  const { code } = req.params
  try {
    let [rows] = await pool.query(
      'SELECT id, code, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
      [code],
    )

    if (rows.length === 0 && code.endsWith('.mp4')) {
      const baseCode = code.slice(0, -4)
      ;[rows] = await pool.query(
        'SELECT id, code, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
        [baseCode],
      )
    }

    if (rows.length === 0 && !code.endsWith('.mp4')) {
      const mp4Code = code + '.mp4'
      ;[rows] = await pool.query(
        'SELECT id, code, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
        [mp4Code],
      )
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Shortlink tidak ditemukan' })
    }

    if (!rows[0].is_active) {
      return res.status(410).json({ message: 'Shortlink tidak aktif' })
    }

    // Record click
    await pool.query(
      'INSERT INTO clicks (shortlink_id, clicked_at) VALUES (?, NOW())',
      [rows[0].id]
    )

    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/links', authMiddleware, async (req, res) => {
  const { originalUrl, extension } = req.body || {}
  if (!originalUrl) {
    return res.status(400).json({ message: 'originalUrl wajib diisi' })
  }

  const suffix = extension === '.mp4' ? '.mp4' : ''

  try {
    let code = generateCode() + suffix
    let exists = true

    while (exists) {
      const [rows] = await pool.query(
        'SELECT id FROM shortlinks WHERE code = ? LIMIT 1',
        [code],
      )
      if (rows.length === 0) {
        exists = false
      } else {
        code = generateCode() + suffix
      }
    }

    const [result] = await pool.query(
      'INSERT INTO shortlinks (code, original_url, is_active, created_at) VALUES (?, ?, 1, NOW())',
      [code, originalUrl],
    )

    res.status(201).json({
      id: result.insertId,
      code,
      original_url: originalUrl,
      is_active: 1,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.delete('/api/links/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  try {
    const [result] = await pool.query('DELETE FROM shortlinks WHERE id = ?', [
      id,
    ])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' })
    }
    res.json({ message: 'Berhasil dihapus' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.patch('/api/links/:id/active', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body || {}
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive harus boolean' })
  }
  try {
    const [result] = await pool.query(
      'UPDATE shortlinks SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, id],
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' })
    }
    return res.json({ message: 'Status berhasil diperbarui' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

app.get('/:code', async (req, res) => {
  const { code } = req.params
  try {
    let [rows] = await pool.query(
      'SELECT id, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
      [code],
    )

    if (rows.length === 0 && code.endsWith('.mp4')) {
      const baseCode = code.slice(0, -4)
      ;[rows] = await pool.query(
        'SELECT id, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
        [baseCode],
      )
    }

    if (rows.length === 0 && !code.endsWith('.mp4')) {
      const mp4Code = code + '.mp4'
      ;[rows] = await pool.query(
        'SELECT id, original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
        [mp4Code],
      )
    }

    if (rows.length === 0) {
      return res.status(404).send('Shortlink tidak ditemukan')
    }
    if (!rows[0].is_active) {
      return res.status(410).send('Shortlink tidak aktif')
    }

    // Record click
    await pool.query(
      'INSERT INTO clicks (shortlink_id, clicked_at) VALUES (?, NOW())',
      [rows[0].id]
    )

    res.redirect(rows[0].original_url)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

