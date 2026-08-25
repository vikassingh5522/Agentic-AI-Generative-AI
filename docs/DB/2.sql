drop database ftopenlayerdb_test;

create database ftopenlayerdb_test;

use ftopenlayerdb_test;

---- ✅🔥 Workflow Config 

-- 1. Workflow headers
SELECT * FROM automation_workflows;

-- 2. Processes / phases
SELECT * FROM workflow_phases;

-- 3. Sub-workflows
SELECT * FROM sub_workflows;

-- 4. Workflow execution history
SELECT * FROM workflow_executions;

-- 5. Sub-workflow execution history
SELECT * FROM subworkflow_executions;


---- ✅🔥🫡Workflow Design 

-- Canvas nodes
SELECT * FROM workflow_nodes_design;

-- Canvas connections / edges
SELECT * FROM workflow_node_connections;

-- Node / phase properties
SELECT * FROM workflow_node_properties;

-- Alternate graph nodes
SELECT * FROM workflow_nodes;

-- Alternate graph edges
SELECT * FROM workflow_edges;

-- Older workflow design header
SELECT * FROM workflow_design;

-- Node type master
SELECT * FROM workflow_node_types;

-- Banking activity master
SELECT * FROM workflow_activities;

-- Connector master
SELECT * FROM workflow_connectors;

-- Blockchain layer master
SELECT * FROM workflow_blockchain_layers;



---- 🔥✅3. Workflow Viewer

-- Workflow information
SELECT * FROM automation_workflows;

-- Process list
SELECT * FROM workflow_phases;

-- Sub-workflows and design_json
SELECT * FROM sub_workflows;

-- Viewer canvas nodes
SELECT * FROM workflow_nodes_design;

-- Viewer canvas connections

SELECT * FROM workflow_node_connections;-- Workflow information
SELECT * FROM automation_workflows;

-- Process list
SELECT * FROM workflow_phases;

-- Sub-workflows and design_json
SELECT * FROM sub_workflows;

-- Viewer canvas nodes
SELECT * FROM workflow_nodes_design;

-- Viewer canvas connections
SELECT * FROM workflow_node_connections;
