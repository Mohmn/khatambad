
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

export {
    getForeignKeyTableNameQueryFunction,
    getColumnNamesQueryFunction,
}