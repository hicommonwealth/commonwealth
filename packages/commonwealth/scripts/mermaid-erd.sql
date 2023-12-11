select 'erDiagram'

union all
/*
    Using }|..|| cardinality by default
    1+ .. 1

    TODO: Consider the following options
    left    right   meaning
    ------------------------------------
    |o      o|      Zero or one
    ||      ||      Exactly one
    }o      o{      Zero or more (no upper limit)
    }|      |{      One or more (no upper limit)
*/
select
    format('  %s }|..|| %s : %s', c1.relname, c2.relname, c.conname)
from
    pg_constraint c
    join pg_class c1 on c.conrelid = c1.oid and c.contype = 'f'
    join pg_class c2 on c.confrelid = c2.oid
where
    not c1.relispartition and not c2.relispartition

union all
select
    format(E'  %s {\n%s\n  }', 
        c.relname, 
        string_agg(format(E'    %s %s %s', 
            replace(replace(format_type(t.oid, a.atttypmod), ' ', '-'), '"', ''), 
            a.attname,
            CASE WHEN pk.indrelid IS NULL THEN '' ELSE 'PK' END
        ), E'\n'))
from
    pg_class c 
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attribute a ON c.oid = a.attrelid and a.attnum > 0 and not a.attisdropped
    left join pg_type t ON a.atttypid = t.oid
    left join pg_index pk ON c.oid = pk.indrelid AND a.attnum = ANY(pk.indkey) AND pk.indisprimary = TRUE
where
    c.relkind in ('r', 'p') 
    and not c.relispartition
    and n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
group by c.relname;
 