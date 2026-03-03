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
    const [[row]] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM shortlinks',
    )
    res.json({
      total: row.total || 0,
      active: row.active || 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/links/:code', async (req, res) => {
  const { code } = req.params
  try {
    const [rows] = await pool.query(
      'SELECT code, original_url FROM shortlinks WHERE code = ? LIMIT 1',
      [code],
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Shortlink tidak ditemukan' })
    }
    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/links', authMiddleware, async (req, res) => {
  const { originalUrl } = req.body || {}
  if (!originalUrl) {
    return res.status(400).json({ message: 'originalUrl wajib diisi' })
  }

  try {
    let code = generateCode()
    let exists = true

    while (exists) {
      const [rows] = await pool.query(
        'SELECT id FROM shortlinks WHERE code = ? LIMIT 1',
        [code],
      )
      if (rows.length === 0) {
        exists = false
      } else {
        code = generateCode()
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
    const [rows] = await pool.query(
      'SELECT original_url, is_active FROM shortlinks WHERE code = ? LIMIT 1',
      [code],
    )
    if (rows.length === 0) {
      return res.status(404).send('Shortlink tidak ditemukan')
    }
    if (!rows[0].is_active) {
      return res.status(410).send('Shortlink tidak aktif')
    }
    res.redirect(rows[0].original_url)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

