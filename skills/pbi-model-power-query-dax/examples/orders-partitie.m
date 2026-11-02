// Voorbeeld: importpartitie voor een ordertabel in de veilige volgorde.
// Foldbare stappen eerst (WHERE, SELECT, CAST, ORDER BY), niet-foldbare stap als laatste.
// SqlEndpoint en Database zijn gedeelde M-parameters van het model.
let
    Source = Sql.Database(SqlEndpoint, Database),
    Data = Source{[Schema="dbo", Item="Orders"]}[Data],

    // 1. Rijen filteren (foldt naar WHERE)
    #"Filtered Rows" = Table.SelectRows(Data, each [Status] <> "Cancelled" and [Year] >= 2023),

    // 2. Kolommen selecteren (foldt naar SELECT)
    #"Selected Columns" = Table.SelectColumns(#"Filtered Rows",
        {"OrderId", "OrderDate", "CustomerId", "Warehouse", "Quantity", "Amount", "Status"}),

    // 3. Types zetten (foldt naar CAST)
    #"Set Types" = Table.TransformColumnTypes(#"Selected Columns", {
        {"OrderId", Int64.Type},
        {"OrderDate", type date},
        {"Quantity", Int64.Type},
        {"Amount", Currency.Type}
    }),

    // 4. Niet-foldbare stap als laatste (draait in de mashup-engine)
    #"Added Order Size" = Table.AddColumn(#"Set Types", "Order Size",
        each if [Amount] > 10000 then "Large" else "Small", type text)
in
    #"Added Order Size"
