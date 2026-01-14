const Visualizer = {
    parseSql(sql) {
        // Remove comments and normalize whitespace
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ');

        const tables = new Set();
        const relationships = [];

        // Regex for FROM and JOIN
        // Simple regex, assumes standard "FROM table t" or "JOIN table t ON ..."
        const fromRegex = /FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i;
        const joinRegex = /JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi;

        const fromMatch = cleanSql.match(fromRegex);
        if (fromMatch) {
            const tableName = fromMatch[1];
            const alias = fromMatch[2] || tableName;
            tables.add(tableName);
            // We store alias map if needed, but for ER diagram usually table names are enough unless we want to map aliases.
            // For simple ER diagram, we'll use table names.
        }

        let match;
        while ((match = joinRegex.exec(cleanSql)) !== null) {
            const tableName = match[1];
            tables.add(tableName);

            // Analyze ON clause to find relationship
            // match[3] and match[4] are like "t1.id" and "t2.ref_id"
            const left = match[3];
            const right = match[4];

            // Try to extract table names from columns if they have aliases
            // This is complex so we'll simplify: just show a link between the tables found in this JOIN
            // We assume the JOIN is connecting to one of the previously found tables.

            // For the visualizer, we just want to show "Table A connects to Table B"
            // We can't easily retrieve the "other" table from just the ON clause without full parsing
            // So we will assume the JOIN is sequentially adding to the graph. 
            // Better approach: just list all tables and draw lines? 
            // Mermaid erDiagram requires: Table1 ||--o{ Table2 : "joins on"

            // Let's try to infer from the columns.
            // If we have "orders o JOIN customers c ON o.customer_id = c.customer_id"
            // We need to know who 'o' and 'c' are. 

            relationships.push({
                table: tableName,
                condition: `${left} = ${right}`
            });
        }

        return {
            tables: Array.from(tables),
            relationships
        };
    },

    generateMermaid(sql) {
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ');

        let mermaidCode = 'erDiagram\n';
        const tables = new Map(); // alias -> realName

        // 1. Identify FROM
        const fromRegex = /FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i;
        const fromMatch = cleanSql.match(fromRegex);

        if (!fromMatch) return ''; // valid SQL not found

        const rootTable = fromMatch[1];
        const rootAlias = fromMatch[2] || rootTable;
        tables.set(rootAlias, rootTable);
        tables.set(rootTable, rootTable); // self-map

        // 2. Identify JOINs
        const joinRegex = /(?:INNER|LEFT|RIGHT|OUTER)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi;

        let match;
        while ((match = joinRegex.exec(cleanSql)) !== null) {
            const table = match[1];
            const alias = match[2] || table;
            const leftOp = match[3];  // e.g. o.cust_id
            const rightOp = match[4]; // e.g. c.cust_id

            tables.set(alias, table);
            tables.set(table, table);

            // Try to resolve aliases in ON clause
            const resolveTable = (op) => {
                if (op.includes('.')) {
                    const parts = op.split('.');
                    return tables.get(parts[0]) || parts[0];
                }
                return 'UNKNOWN'; // Hard to guess if no alias
            };

            const leftTable = resolveTable(leftOp);
            const rightTable = resolveTable(rightOp);

            // Clean up column names for label
            const leftCol = leftOp.includes('.') ? leftOp.split('.')[1] : leftOp;

            // Add relationship to diagram
            // If resolution failed, default to connecting the newly joined table to the root (heuristic)
            const source = (leftTable !== 'UNKNOWN' && leftTable !== table) ? leftTable :
                (rightTable !== 'UNKNOWN' && rightTable !== table) ? rightTable : rootTable;

            mermaidCode += `    ${source} ||--o{ ${table} : ${leftCol}\n`;
        }

        return mermaidCode;
    }
};
