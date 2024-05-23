docker exec -it <container_name_or_id> psql -U ${postgres_user} -d ${dbname}




firstly i populated db with 200000 values and then deleted it 

then after i ran this query

SELECT              
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_table_size(relid) - pg_indexes_size(relid)) AS toast_size
FROM
    pg_catalog.pg_statio_user_tables
ORDER BY
    pg_total_relation_size(relid) DESC;


table_name   | total_size | table_size | indexes_size | toast_size 
---------------+------------+------------+--------------+------------
 seller        | 293 MB     | 24 kB      | 293 MB       | 0 bytes
 customer      | 224 MB     | 133 MB     | 92 MB        | 0 bytes
 product       | 100 MB     | 71 MB      | 29 MB        | 0 bytes
 sellerproduct | 16 kB      | 0 bytes    | 16 kB        | 0 bytes
 cart          | 16 kB      | 0 bytes    | 16 kB        | 0 bytes
 Order         | 8192 bytes | 0 bytes    | 8192 bytes   | 0 bytes
(6 rows)


why do we have such high indexes whitout haing any data in the tables

just use VACCUM(FULL) to reclaim index space or reindex

Stale Indexes: If data was previously in these tables and then deleted, the indexes may still be large due to not being reorganized or vacuumed. PostgreSQL, for example, does not immediately reclaim space from deleted rows but marks them as available for reuse. Over time, if the space isn't reused or if VACUUM isn't run, the indexes can remain large despite the lack of data.

Unused Space: Indexes might have a lot of unused space within them, especially if rows have been frequently updated or deleted. This can leave behind dead tuples and bloat the index.

Index Structure: Certain types of indexes, like those built with CREATE INDEX in PostgreSQL, can consume more space due to their structure or the way they handle specific types of data. Indexes designed for performance on specific queries might also be larger due to including additional columns (composite indexes) or due to their nature (e.g., GiST, GIN).

Maintenance Needs: The database may be in need of maintenance tasks like vacuuming, which helps to reclaim storage occupied by dead tuples. In PostgreSQL, running VACUUM FULL can reclaim more space but requires exclusive lock on the table.

Configuration and Usage Patterns: If the tables are heavily indexed to optimize read performance, and the configuration of the database is such that it retains a large buffer or a high fillfactor, indexes might occupy more space. This configuration could be intentional to speed up read operations at the cost of more disk space.

To address these issues, consider running maintenance operations such as:

VACUUM (FULL) if you suspect that the space is not being effectively reused.
REINDEX to rebuild indexes and potentially reduce their size if they have become bloated.
Additionally, reviewing the query patterns and index usage might help determine if all indexes are necessary or if some can be dropped or optimized.