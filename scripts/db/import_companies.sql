-- Import companies_registry from CSV
COPY companies_registry (
  hp_number, name_hebrew, name_english, company_type, status, 
  description, purpose, incorporation_date, government_company, 
  limitations, violations, last_annual_report_year, address_city, 
  address_street, address_house_number, address_zipcode, address_pobox, 
  address_country, address_care_of, status_sub, status_code, 
  company_type_code, company_classification_code, purpose_code, 
  limitations_code, violations_code, city_code, street_code, country_code
) 
FROM '/tmp/companies_final.csv' 
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', QUOTE '"');

-- Show import statistics
SELECT 
  COUNT(*) as total_companies,
  COUNT(DISTINCT status) as unique_statuses,
  COUNT(DISTINCT company_type) as unique_company_types,
  COUNT(CASE WHEN status = 'פעילה' THEN 1 END) as active_companies
FROM companies_registry;
