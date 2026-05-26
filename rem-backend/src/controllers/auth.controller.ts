import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_local_key_for_africa_market';

export const registerCompanyAndUser = async (req: Request, res: Response): Promise<void> => {
  const { companyName, country, firstName, lastName, email, password } = req.body;
  
  logger.info({ email }, '[AUTH] Tentative d inscription pour : ' + companyName);

  try {
    // 1. Vérification existance
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rowCount && checkUser.rowCount > 0) {
      res.status(400).json({ error: 'Cet e-mail est déjà utilisé.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 2. Transaction sécurisée
    await db.query('BEGIN');

    const companyResult = await db.query(
      'INSERT INTO companies (name, country) VALUES ($1, $2) RETURNING id',
      [companyName, country]
    );
    const companyId = companyResult.rows[0].id;

    const userResult = await db.query(
      'INSERT INTO users (company_id, first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [companyId, firstName, lastName, email, passwordHash, 'ADMIN']
    );
    
    await db.query('COMMIT');

    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id, companyId, role: user.role }, JWT_SECRET, { expiresIn: '90d' });

    res.status(201).json({ message: 'Compte créé avec succès', token });

  } catch (error) {
    await db.query('ROLLBACK');
    logger.error(error, '[AUTH ERROR] Échec transactionnel');
    res.status(500).json({ error: 'Erreur interne lors de la création.' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userResult.rowCount === 0) {
      res.status(401).json({ message: 'Identifiants incorrects.' });
      return;
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Identifiants incorrects.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, firstName: user.first_name, companyId: user.company_id, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};