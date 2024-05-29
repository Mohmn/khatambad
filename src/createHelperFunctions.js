function getForeignKeyTableNameQueryFunction() {
  return `
    CREATE OR REPLACE FUNCTION get_foreign_key_table_name(query_table_name text, query_column_name text)
    RETURNS text AS $$
    DECLARE
        fk_table_name text;
        BEGIN
            SELECT ccu.table_name
            INTO fk_table_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = query_table_name
            AND kcu.column_name = query_column_name
            LIMIT 1;

            RETURN fk_table_name;
        END;
    $$ LANGUAGE plpgsql;

    `;
}

function getColumnNamesQueryFunction() {
  return `
    CREATE OR REPLACE FUNCTION get_column_names(query_table_name text)
        RETURNS TEXT[] AS $$
        DECLARE
            column_names TEXT[] = ARRAY[]::TEXT[];
            column_name_loop text;
        BEGIN
            for column_name_loop in
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = query_table_name
            LOOP
                column_names := column_names || column_name_loop;
            END LOOP;
            RETURN column_names;
        END;
    $$ LANGUAGE plpgsql;
    `;
}

/**
 * Retrieves unique column names from a specified table in the database.
 * 
 * @param {string} query_table_name - The name of the table to retrieve unique column names from.
 * @returns {string[]} - An array of unique column names in the specified table. expected results  {'{seller_id,product_id}'} in case of a composite key
 */
function getUniqueColumnNamesFromTableFunction() {
  return `
      CREATE OR REPLACE FUNCTION get_unique_column_names_from_table(query_table_name text)
          RETURNS TEXT[][] AS $$
          DECLARE
              unique_column_name text;
              unique_column_names TEXT[][] = ARRAY[]::TEXT[][];
          BEGIN
            for unique_column_name in
                SELECT ARRAY_AGG(c.column_name ORDER BY c.ordinal_position) AS columns
                FROM information_schema.table_constraints AS t
                JOIN information_schema.key_column_usage AS c ON t.constraint_name = c.constraint_name
                    AND c.table_schema = t.table_schema
                    AND c.table_name = t.table_name
                WHERE t.constraint_type = 'UNIQUE'
                    AND t.table_name = query_table_name
                GROUP BY t.constraint_name
                ORDER BY t.constraint_name
            LOOP
                unique_column_names := unique_column_names || unique_column_name;
            END LOOP;
            RETURN unique_column_names;
          END;
      $$ LANGUAGE plpgsql;
      `;
}


function isForeignKeyQueryFunction() {
  return `
        CREATE OR REPLACE FUNCTION public.is_foreign_key(
            query_table_name text, 
            query_column_name text
        )
        RETURNS boolean
        LANGUAGE plpgsql
        AS $function$
        DECLARE
            fk_exists boolean := false;
            key text;
        BEGIN
            FOR key IN
                SELECT kcu.column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = query_table_name
                    AND kcu.column_name = query_column_name
            LOOP
                fk_exists := true;
            END LOOP;
            RETURN fk_exists;
        END;
        $function$;   
    `;
}

export { 
  getForeignKeyTableNameQueryFunction, 
  getColumnNamesQueryFunction, 
  getUniqueColumnNamesFromTableFunction, 
  isForeignKeyQueryFunction 
};
