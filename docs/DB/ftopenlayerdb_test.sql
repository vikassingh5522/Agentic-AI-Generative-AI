drop database ftopenlayerdb_test;

create database ftopenlayerdb_test;

use ftopenlayerdb_test;
 
show tables;

select * from roles;
		
select * from organization_employees;

desc organization_employees;
                          
select * from role_permissions; 

select * from master_partners;

select * from master_systems;

select * from automation_workflows; 

select * from workflow_phases;
-- node edges  
select * from sub_workflows;

select * from subworkflow_executions;

select * from workflow_ai_agents;

select * from workflow_design;

select * from workflow_ai_agent_input_types;

select * from workflow_ai_agent_supported_systems;

select * from workflow_activities;

-- workflow design 
select * from workflow_design;
--  workflow_edges
select * from workflow_edges;
-- workflow_evaluation
select * from workflow_evaluation;
--  workflow_evaluation_scores
select * from workflow_evaluation_scores;

-- workflow_executions
select * from workflow_executions;

-- workflow_node_connections

select * from workflow_node_connections;

--  workflow_node_properties
select * from workflow_node_properties;

--  workflow_node_types
select * from workflow_node_types;

--  workflow_nodes
select * from workflow_nodes;

-- workflow_nodes_design
select * from workflow_nodes_design;

--  workflow_phases
select * from workflow_phases;

-- Tables used for Cheque Book
select * from automation_workflows;
select * from workflow_phases; 
select * from sub_workflows;
select * from workflow_ai_agents;
select * from organization_systems;
select * from system_integrations;
select * from master_organization;
select * from organization_employees;

-- ==========================================
-- Organization & Master Tables
-- ==========================================
SELECT * FROM master_organization;
SELECT * FROM organization_employees;

-- ==========================================
-- Workflow Core Tables
-- ==========================================
SELECT * FROM automation_workflows;
SELECT * FROM workflow_phases;
SELECT * FROM sub_workflows;
SELECT * FROM workflow_ai_agents;

-- ==========================================
-- Systems & Integrations
-- ==========================================
SELECT * FROM organization_systems;
SELECT * FROM system_integrations;

-- ==========================================
-- Workflow Designer Palette Tables
-- ==========================================
SELECT * FROM workflow_connectors;
SELECT * FROM workflow_activities;
SELECT * FROM workflow_node_types;
SELECT * FROM workflow_blockchain_layers;

-- ==========================================
-- Blockchain
-- ==========================================
SELECT * FROM blockchain_audit;

-- ==========================================
-- Legacy Workflow Designer Tables
-- ==========================================
SELECT * FROM workflow_design;
SELECT * FROM workflow_nodes_design;
SELECT * FROM workflow_node_connections;
SELECT * FROM workflow_nodes;
SELECT * FROM workflow_edges;


-- View all data from every master table 
SELECT * FROM master_categories;

SELECT * FROM master_sub_categories;



SELECT * FROM master_input_types;

SELECT * FROM master_output_types;

SELECT * FROM master_supported_systems;

SELECT * FROM master_agent_types;

SELECT * FROM master_execution_modes;

SELECT * FROM master_security_classifications;

SELECT * FROM master_sla;

SELECT * FROM master_knowledge_bases;

SELECT * FROM master_llm_models;

SELECT * FROM master_icons;

--  workflow_ai_agents
SELECT * FROM workflow_ai_agents
WHERE ai_agent_code IN (
    'AI-CB-CR',
    'AI-CB-FF',
    'AI-CB-DC',
    'AI006',
    'AI007',
    'AI008'
);



-- 
-- Workflow WF-CARD-DISPATCH'
SELECT * FROM automation_workflows
WHERE workflow_code = 'WF-CARD-DISPATCH';

-- Workflow Phases (9 Processes)
SELECT * FROM workflow_phases
WHERE workflow_id = (
    SELECT workflow_id
    FROM automation_workflows
    WHERE workflow_code = 'WF-CARD-DISPATCH'
);

-- Sub Workflows
SELECT * FROM sub_workflows
WHERE phase_id IN (
    SELECT phase_id
    FROM workflow_phases
    WHERE workflow_id = (
        SELECT workflow_id
        FROM automation_workflows
        WHERE workflow_code = 'WF-CARD-DISPATCH'
    )
);

-- Organization Systems
SELECT *
FROM organization_systems
WHERE organization_id = (
    SELECT id
    FROM master_organization
    WHERE TRIM(name) = 'Ujjivan Bank'
);

-- System Integrations (APIs)
SELECT *
FROM system_integrations
WHERE organization_id = (
    SELECT id
    FROM master_organization
    WHERE TRIM(name) = 'Ujjivan Bank'
);

-- Master Systems
SELECT * FROM master_systems
WHERE system_code IN (
    'BRANCH_PORTAL',
    'CRM',
    'CORE_BANKING_SYSTEM',
    'PRODUCTION_FILE_SERVER',
    'SFTP_GATEWAY',
    'VENDOR_FSS_DR',
    'EMBOSSING_VENDOR',
    'LOGISTICS_COURIER_PLATFORM',
    'NOTIFICATION_SERVICE',
    'OPEN_LAYER_CONSOLE',
    'BLOCKCHAIN_LEDGER'
);


-- Master Categories
SELECT * FROM master_categories;

-- Master Sub Categories
SELECT * FROM master_sub_categories;