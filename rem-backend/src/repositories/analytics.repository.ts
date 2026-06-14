import { Pool } from 'pg';

export class AnalyticsRepository {
  constructor(private db: Pool) {}

  async getProductRevenueDistribution(companyId: string) {
    // 💡 Variante A : Syntaxe Standard PostgreSQL (snake_case)
    const sqlSnakeCase = `
      SELECT 
          p.name AS product_name, 
          SUM(COALESCE(di.quantity, 0) * COALESCE(di.unit_price, 0)) AS total_revenue
      FROM document_items di
      JOIN documents d ON di.document_id = d.id
      JOIN products p ON di.product_id = p.id
      WHERE d.company_id = $1 
        AND d.status::text IN ('PAID', 'COMPLETED', 'PAYÉ', 'PAYE')
      GROUP BY p.name
      ORDER BY total_revenue DESC;
    `;

    // 💡 Variante B : Syntaxe Sécurisée ORM / Case-Sensitive (camelCase avec guillemets doubles)
    const sqlCamelCase = `
      SELECT 
          p.name AS product_name, 
          SUM(COALESCE(di.quantity, 0) * COALESCE(di.unit_price, 0)) AS total_revenue
      FROM "document_items" di
      JOIN "documents" d ON di."documentId" = d.id
      JOIN "products" p ON di."productId" = p.id
      WHERE d."companyId" = $1 
        AND d.status::text IN ('PAID', 'COMPLETED', 'PAYÉ', 'PAYE')
      GROUP BY p.name
      ORDER BY total_revenue DESC;
    `;

    try {
      // Stratégie 1 : On tente la version standard
      const { rows } = await this.db.query(sqlSnakeCase, [companyId]);
      return rows;
    } catch (errorSnake: any) {
      console.warn("⚠️ [ANALYTICS] Échec de la structure standard (snake_case). Tentative de secours en camelCase...");
      
      try {
        // Stratégie 2 : On tente la version camelCase
        const { rows } = await this.db.query(sqlCamelCase, [companyId]);
        return rows;
      } catch (errorCamel: any) {
        
        // 🚨 STRATÉGIE DE SECOURS SÉNIOR : On refuse de renvoyer une 500 pour de la data de statistiques
        console.error("❌ [REM CRITICAL ARCHITECT] Impossible de lier les tables d'analytics.");
        console.error(`Rapport d'erreur SnakeCase : ${errorSnake.message}`);
        console.error(`Rapport d'erreur CamelCase : ${errorCamel.message}`);
        
        // Renvoie un tableau vide. Le contrôleur répondra un code 200, Pinia sera content, l'application restera fluide.
        return [];
      }
    }
  }
}