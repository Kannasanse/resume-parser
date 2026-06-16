-- Skills Library: tables, indexes, RLS, seed data, and SQL function

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists skill_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table if not exists skills (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  category        text not null,
  subcategory     text,
  aliases         text[] default '{}',
  description     text,
  is_active       boolean default true,
  is_trending     boolean default false,
  is_verified     boolean default true,
  source          text default 'manual',
  esco_uri        text,
  icon_url        text,
  related_skills  uuid[] default '{}',
  search_count    integer default 0,
  selection_count integer default 0,
  course_count    integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  created_by      uuid references auth.users(id) on delete set null
);

create table if not exists skill_analytics (
  id          uuid primary key default gen_random_uuid(),
  skill_id    uuid references skills(id) on delete cascade,
  event_type  text not null,
  user_id     uuid references auth.users(id) on delete set null,
  context     text,
  created_at  timestamptz default now()
);

create table if not exists user_submitted_skills (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  submitted_by uuid references auth.users(id) on delete set null,
  status      text default 'pending',
  merged_into uuid references skills(id) on delete set null,
  admin_note  text,
  created_at  timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_skills_name_trgm on skills using gin (name gin_trgm_ops);
create index if not exists idx_skills_category on skills (category) where is_active = true;
create index if not exists idx_skills_trending on skills (is_trending, selection_count desc) where is_active = true;
create index if not exists idx_skills_active on skills (is_active, selection_count desc);
create index if not exists idx_skill_analytics_skill_id on skill_analytics (skill_id);
create index if not exists idx_skill_analytics_created_at on skill_analytics (created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table skills enable row level security;
alter table skill_analytics enable row level security;
alter table user_submitted_skills enable row level security;

do $$ begin
  create policy "Public can read active skills" on skills for select using (is_active = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin full access to skills" on skills for all
    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can insert analytics" on skill_analytics for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can submit skills" on user_submitted_skills for insert
    with check (auth.uid() = submitted_by);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin full access to submissions" on user_submitted_skills for all
    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
exception when duplicate_object then null;
end $$;

-- ── SQL Function: atomic counter increment ────────────────────────────────────

create or replace function increment_skill_counter(skill_id uuid, column_name text)
returns void language plpgsql security definer as $$
begin
  if column_name not in ('search_count', 'selection_count', 'course_count') then
    raise exception 'Invalid column name: %', column_name;
  end if;
  execute format('update skills set %I = %I + 1, updated_at = now() where id = $1', column_name, column_name)
  using skill_id;
end;
$$;

-- ── Category Seed ─────────────────────────────────────────────────────────────

insert into skill_categories (name, slug, description, icon, sort_order) values
  ('Programming Languages', 'programming-languages', 'Core programming languages',              '💻', 1),
  ('Web & Frontend',        'web-frontend',          'Frontend frameworks and web technologies','🌐', 2),
  ('Backend & APIs',        'backend-apis',          'Server-side frameworks and databases',    '⚙️', 3),
  ('DevOps & Cloud',        'devops-cloud',          'Infrastructure, cloud, and CI/CD',        '☁️', 4),
  ('Data & AI',             'data-ai',               'Data science, ML, and AI tools',          '🤖', 5),
  ('Mobile',                'mobile',                'iOS, Android, and cross-platform',        '📱', 6),
  ('Design & UX',           'design-ux',             'Design tools and UX methods',             '🎨', 7),
  ('Product & Management',  'product-management',    'Product, agile, and project management',  '📋', 8),
  ('Cybersecurity',         'cybersecurity',         'Security and ethical hacking',            '🔒', 9),
  ('Soft Skills',           'soft-skills',           'Communication and professional skills',   '🤝', 10),
  ('Databases',             'databases',             'Relational and NoSQL databases',          '🗄️', 11),
  ('Testing & QA',          'testing-qa',            'Testing frameworks and QA practices',     '✅', 12)
on conflict (slug) do nothing;

-- ── Skills Seed ───────────────────────────────────────────────────────────────

insert into skills (name, slug, category, aliases, description) values
  -- Programming Languages
  ('Python',       'python',       'Programming Languages', '{"Python 3","Python2"}',          'General-purpose language widely used in data science, web development, and automation'),
  ('JavaScript',   'javascript',   'Programming Languages', '{"JS","ECMAScript"}',             'The primary language of the web, used for both frontend and backend development'),
  ('TypeScript',   'typescript',   'Programming Languages', '{"TS"}',                          'Typed superset of JavaScript that compiles to plain JavaScript'),
  ('Java',         'java',         'Programming Languages', '{"Java 11","Java 17"}',           'Object-oriented language widely used in enterprise software and Android development'),
  ('C#',           'csharp',       'Programming Languages', '{"C Sharp","dotnet"}',            'Microsoft language used for Windows apps, games, and enterprise software'),
  ('C++',          'cpp',          'Programming Languages', '{"C Plus Plus","CPP"}',           'Systems programming language used in games, OS, and performance-critical software'),
  ('Go',           'go',           'Programming Languages', '{"Golang"}',                      'Google-created language known for simplicity and high performance'),
  ('Rust',         'rust',         'Programming Languages', '{}',                              'Memory-safe systems language focused on performance and reliability'),
  ('Swift',        'swift',        'Programming Languages', '{}',                              'Apple language for iOS, macOS, and other Apple platform development'),
  ('Kotlin',       'kotlin',       'Programming Languages', '{}',                              'Modern JVM language used for Android development and server-side apps'),
  ('PHP',          'php',          'Programming Languages', '{}',                              'Server-side scripting language widely used in web development'),
  ('Ruby',         'ruby',         'Programming Languages', '{}',                              'Dynamic language known for simplicity and the Rails web framework'),
  ('Scala',        'scala',        'Programming Languages', '{}',                              'JVM language combining object-oriented and functional programming'),
  ('R',            'r-language',   'Programming Languages', '{"R Language"}',                  'Statistical computing language used in data analysis and bioinformatics'),
  ('Dart',         'dart',         'Programming Languages', '{}',                              'Google language used primarily with the Flutter framework'),
  ('Lua',          'lua',          'Programming Languages', '{}',                              'Lightweight scripting language used in games and embedded systems'),
  ('Perl',         'perl',         'Programming Languages', '{}',                              'Text-processing language used in system administration and bioinformatics'),
  ('Haskell',      'haskell',      'Programming Languages', '{}',                              'Pure functional programming language'),
  ('Elixir',       'elixir',       'Programming Languages', '{}',                              'Functional language built on Erlang VM for scalable applications'),
  ('Clojure',      'clojure',      'Programming Languages', '{}',                              'Lisp dialect for the JVM focused on immutability and concurrency'),

  -- Web & Frontend
  ('React',        'react',        'Web & Frontend', '{"ReactJS","React.js"}',                 'Facebook JavaScript library for building user interfaces'),
  ('Vue.js',       'vuejs',        'Web & Frontend', '{"Vue","VueJS"}',                        'Progressive JavaScript framework for building user interfaces'),
  ('Angular',      'angular',      'Web & Frontend', '{"AngularJS","Angular 2+"}',             'Google TypeScript-based web application framework'),
  ('Next.js',      'nextjs',       'Web & Frontend', '{"NextJS","Next"}',                      'React framework with server-side rendering and static site generation'),
  ('Nuxt.js',      'nuxtjs',       'Web & Frontend', '{"NuxtJS","Nuxt"}',                      'Vue.js framework for universal application development'),
  ('Svelte',       'svelte',       'Web & Frontend', '{"SvelteKit"}',                          'Compiler-based JavaScript framework with minimal runtime overhead'),
  ('HTML',         'html',         'Web & Frontend', '{"HTML5","HTML/CSS"}',                   'Standard markup language for creating web pages'),
  ('CSS',          'css',          'Web & Frontend', '{"CSS3"}',                               'Style sheet language for describing the presentation of web pages'),
  ('Tailwind CSS', 'tailwindcss',  'Web & Frontend', '{"Tailwind"}',                           'Utility-first CSS framework for rapid UI development'),
  ('Bootstrap',    'bootstrap',    'Web & Frontend', '{}',                                     'Popular CSS framework for responsive web design'),
  ('Redux',        'redux',        'Web & Frontend', '{"Redux Toolkit","RTK"}',                'Predictable state management library for JavaScript applications'),
  ('GraphQL',      'graphql',      'Web & Frontend', '{}',                                     'Query language for APIs and runtime for executing queries'),
  ('REST APIs',    'rest-apis',    'Web & Frontend', '{"RESTful API","REST"}',                 'Architectural style for designing networked applications'),
  ('Webpack',      'webpack',      'Web & Frontend', '{}',                                     'Static module bundler for modern JavaScript applications'),
  ('Vite',         'vite',         'Web & Frontend', '{}',                                     'Fast build tool and development server for modern web projects'),
  ('Sass',         'sass',         'Web & Frontend', '{"SCSS","Sass/SCSS"}',                   'CSS preprocessor adding variables, nesting, and mixins'),
  ('Three.js',     'threejs',      'Web & Frontend', '{}',                                     'JavaScript library for 3D graphics in the browser'),
  ('D3.js',        'd3js',         'Web & Frontend', '{"D3"}',                                 'JavaScript library for producing dynamic, interactive data visualizations'),
  ('WebSockets',   'websockets',   'Web & Frontend', '{}',                                     'Protocol for full-duplex communication channels over TCP'),

  -- Backend & APIs
  ('Node.js',        'nodejs',        'Backend & APIs', '{"NodeJS","Node"}',                   'JavaScript runtime built on Chrome V8 engine for server-side development'),
  ('Express.js',     'expressjs',     'Backend & APIs', '{"Express"}',                         'Minimal and flexible Node.js web application framework'),
  ('FastAPI',        'fastapi',       'Backend & APIs', '{}',                                  'Modern, high-performance Python web framework for building APIs'),
  ('Django',         'django',        'Backend & APIs', '{"Django REST Framework","DRF"}',     'High-level Python web framework encouraging rapid development'),
  ('Flask',          'flask',         'Backend & APIs', '{}',                                  'Lightweight Python web framework'),
  ('Spring Boot',    'spring-boot',   'Backend & APIs', '{"Spring","Spring Framework"}',       'Java framework for building production-ready applications'),
  ('Laravel',        'laravel',       'Backend & APIs', '{}',                                  'PHP web application framework with elegant syntax'),
  ('Ruby on Rails',  'rails',         'Backend & APIs', '{"Rails","RoR"}',                     'Server-side web application framework written in Ruby'),
  ('NestJS',         'nestjs',        'Backend & APIs', '{}',                                  'Progressive Node.js framework for building efficient server-side applications'),
  ('gRPC',           'grpc',          'Backend & APIs', '{}',                                  'High-performance RPC framework developed by Google'),
  ('Microservices',  'microservices', 'Backend & APIs', '{}',                                  'Architectural pattern for building applications as small, independent services'),
  ('Message Queues', 'message-queues','Backend & APIs', '{"RabbitMQ","Apache Kafka","Kafka"}', 'Asynchronous messaging systems for distributed applications'),

  -- DevOps & Cloud
  ('Docker',          'docker',         'DevOps & Cloud', '{"Containers","Docker Compose"}',    'Platform for developing, shipping, and running applications in containers'),
  ('Kubernetes',      'kubernetes',     'DevOps & Cloud', '{"K8s"}',                            'Container orchestration system for automating deployment and scaling'),
  ('AWS',             'aws',            'DevOps & Cloud', '{"Amazon Web Services"}',            'Amazon cloud computing platform'),
  ('Google Cloud',    'gcp',            'DevOps & Cloud', '{"GCP","Google Cloud Platform"}',    'Google cloud computing services'),
  ('Azure',           'azure',          'DevOps & Cloud', '{"Microsoft Azure"}',                'Microsoft cloud computing platform'),
  ('CI/CD',           'cicd',           'DevOps & Cloud', '{"Continuous Integration","Continuous Deployment"}', 'Practices for automating software delivery pipelines'),
  ('GitHub Actions',  'github-actions', 'DevOps & Cloud', '{}',                                'Automation platform built into GitHub for CI/CD workflows'),
  ('Jenkins',         'jenkins',        'DevOps & Cloud', '{}',                                'Open-source automation server for building CI/CD pipelines'),
  ('Terraform',       'terraform',      'DevOps & Cloud', '{"Infrastructure as Code","IaC"}',  'Infrastructure as Code tool for provisioning cloud resources'),
  ('Ansible',         'ansible',        'DevOps & Cloud', '{}',                                'IT automation tool for configuration management and deployment'),
  ('Linux',           'linux',          'DevOps & Cloud', '{"Unix","Bash","Shell Scripting"}',  'Open-source operating system widely used in servers and DevOps'),
  ('Nginx',           'nginx',          'DevOps & Cloud', '{}',                                'High-performance web server and reverse proxy'),
  ('Git',             'git',            'DevOps & Cloud', '{"Version Control","GitHub","GitLab"}', 'Distributed version control system'),
  ('Helm',            'helm',           'DevOps & Cloud', '{}',                                'Package manager for Kubernetes applications'),
  ('Serverless',      'serverless',     'DevOps & Cloud', '{"AWS Lambda","Cloud Functions"}',  'Cloud execution model where the provider manages server infrastructure'),
  ('Monitoring',      'monitoring',     'DevOps & Cloud', '{"Prometheus","Grafana","Datadog"}', 'Tools for tracking system performance and application health'),

  -- Data & AI
  ('SQL',                'sql',              'Data & AI', '{"Structured Query Language"}',       'Standard language for managing and querying relational databases'),
  ('Machine Learning',   'machine-learning', 'Data & AI', '{"ML"}',                             'Building systems that learn from data to make predictions'),
  ('Deep Learning',      'deep-learning',    'Data & AI', '{"Neural Networks","DL"}',           'Machine learning using multi-layered neural networks'),
  ('Data Analysis',      'data-analysis',    'Data & AI', '{"Data Analytics"}',                 'Inspecting and interpreting data to discover useful information'),
  ('Python for Data Science','python-data',  'Data & AI', '{"NumPy","SciPy","Data Science"}',   'Using Python libraries for data manipulation and analysis'),
  ('Pandas',             'pandas',           'Data & AI', '{}',                                  'Python library for data manipulation and analysis'),
  ('TensorFlow',         'tensorflow',       'Data & AI', '{"TF","Keras"}',                     'Open-source machine learning framework developed by Google'),
  ('PyTorch',            'pytorch',          'Data & AI', '{}',                                  'Open-source machine learning framework developed by Meta'),
  ('Scikit-learn',       'scikit-learn',     'Data & AI', '{"sklearn"}',                        'Python machine learning library with simple and efficient tools'),
  ('Power BI',           'power-bi',         'Data & AI', '{"PowerBI","Microsoft Power BI"}',   'Business analytics service by Microsoft for interactive visualizations'),
  ('Tableau',            'tableau',          'Data & AI', '{}',                                  'Data visualization platform for business intelligence'),
  ('Apache Spark',       'apache-spark',     'Data & AI', '{"Spark","PySpark"}',                'Unified analytics engine for large-scale data processing'),
  ('Data Engineering',   'data-engineering', 'Data & AI', '{"ETL","Data Pipeline"}',            'Building systems for collecting, storing, and analyzing data at scale'),
  ('LLM Development',    'llm-dev',          'Data & AI', '{"LangChain","AI Development","RAG"}','Building applications using large language models'),
  ('Computer Vision',    'computer-vision',  'Data & AI', '{"OpenCV","Image Recognition"}',     'Teaching computers to interpret and understand visual information'),
  ('NLP',                'nlp',              'Data & AI', '{"Natural Language Processing"}',     'Processing and analyzing human language using computational methods'),
  ('MLOps',              'mlops',            'Data & AI', '{}',                                  'Practices for deploying and maintaining ML models in production'),

  -- Databases
  ('PostgreSQL',    'postgresql',    'Databases', '{"Postgres","pg"}',                           'Powerful open-source relational database'),
  ('MySQL',         'mysql',         'Databases', '{}',                                          'Popular open-source relational database management system'),
  ('MongoDB',       'mongodb',       'Databases', '{"Mongo"}',                                   'Document-oriented NoSQL database'),
  ('Redis',         'redis',         'Databases', '{}',                                          'In-memory data structure store used as cache and message broker'),
  ('Supabase',      'supabase',      'Databases', '{}',                                          'Open-source Firebase alternative built on PostgreSQL'),
  ('Firebase',      'firebase',      'Databases', '{"Firestore","Firebase Realtime DB"}',        'Google platform for building mobile and web applications'),
  ('Elasticsearch', 'elasticsearch', 'Databases', '{"ES","Elastic"}',                            'Distributed search and analytics engine'),
  ('DynamoDB',      'dynamodb',      'Databases', '{"AWS DynamoDB"}',                            'Amazon fully managed NoSQL database service'),
  ('SQLite',        'sqlite',        'Databases', '{}',                                          'Lightweight, file-based relational database'),
  ('Cassandra',     'cassandra',     'Databases', '{"Apache Cassandra"}',                        'Distributed NoSQL database for handling large amounts of data'),

  -- Mobile
  ('React Native',       'react-native',  'Mobile', '{"RN"}',                                   'Framework for building native mobile apps using React'),
  ('Flutter',            'flutter',       'Mobile', '{}',                                        'Google UI toolkit for building natively compiled mobile apps'),
  ('iOS Development',    'ios-dev',       'Mobile', '{"Swift UI","SwiftUI","UIKit"}',            'Building native applications for Apple iOS platform'),
  ('Android Development','android-dev',   'Mobile', '{"Android SDK","Jetpack Compose"}',         'Building native applications for Android platform'),
  ('Expo',               'expo',          'Mobile', '{}',                                        'Platform for making universal React Native apps'),

  -- Design & UX
  ('Figma',          'figma',          'Design & UX', '{}',                                      'Collaborative interface design tool'),
  ('UI/UX Design',   'ui-ux-design',   'Design & UX', '{"User Interface","User Experience"}',   'Designing intuitive and visually appealing user interfaces'),
  ('User Research',  'user-research',  'Design & UX', '{"UX Research"}',                        'Understanding user needs through interviews, surveys, and testing'),
  ('Wireframing',    'wireframing',    'Design & UX', '{"Prototyping","Lo-fi Design"}',          'Creating low-fidelity sketches of interface layouts'),
  ('Adobe XD',       'adobe-xd',       'Design & UX', '{"XD"}',                                 'Adobe tool for UI/UX design and prototyping'),
  ('Sketch',         'sketch',         'Design & UX', '{}',                                      'Vector graphics editor for UI design'),
  ('Motion Design',  'motion-design',  'Design & UX', '{"Animation","After Effects"}',           'Creating animated graphics and visual effects'),
  ('Design Systems', 'design-systems', 'Design & UX', '{}',                                      'Building reusable component libraries and style guides'),
  ('Accessibility',  'accessibility',  'Design & UX', '{"a11y","WCAG"}',                        'Designing products usable by people with disabilities'),

  -- Testing & QA
  ('Jest',          'jest',          'Testing & QA', '{}',                                       'JavaScript testing framework with a focus on simplicity'),
  ('Cypress',       'cypress',       'Testing & QA', '{"E2E Testing","End-to-End Testing"}',     'JavaScript end-to-end testing framework'),
  ('Playwright',    'playwright',    'Testing & QA', '{}',                                       'Microsoft framework for reliable end-to-end testing'),
  ('Unit Testing',  'unit-testing',  'Testing & QA', '{"TDD","Test-Driven Development"}',       'Testing individual components of software in isolation'),
  ('Selenium',      'selenium',      'Testing & QA', '{"WebDriver"}',                            'Browser automation tool for web application testing'),
  ('Pytest',        'pytest',        'Testing & QA', '{}',                                       'Python testing framework for writing simple and scalable tests'),
  ('Postman',       'postman',       'Testing & QA', '{"API Testing"}',                          'Collaboration platform for API development and testing'),

  -- Cybersecurity
  ('Network Security', 'network-security', 'Cybersecurity', '{}',                               'Protecting computer networks from unauthorized access'),
  ('Ethical Hacking',  'ethical-hacking',  'Cybersecurity', '{"Penetration Testing","PenTest"}','Legally testing systems to find security vulnerabilities'),
  ('OWASP',            'owasp',            'Cybersecurity', '{"Web Security"}',                  'Open Web Application Security Project standards and practices'),
  ('Cryptography',     'cryptography',     'Cybersecurity', '{}',                                'Securing information through encoding and encryption techniques'),
  ('SOC',              'soc',              'Cybersecurity', '{"Security Operations","SIEM"}',    'Monitoring and responding to security events'),

  -- Product & Management
  ('Product Management',    'product-management',    'Product & Management', '{"PM","Product Manager"}', 'Guiding a product from conception to launch'),
  ('Agile/Scrum',           'agile-scrum',           'Product & Management', '{"Agile","Scrum","Sprint"}','Iterative development methodology for software projects'),
  ('Project Management',    'project-management',    'Product & Management', '{"PMP","Jira"}',           'Planning, executing, and closing projects successfully'),
  ('Leadership',            'leadership',            'Product & Management', '{}',                       'Guiding and motivating teams to achieve goals'),
  ('OKRs',                  'okrs',                  'Product & Management', '{"Objectives and Key Results"}', 'Goal-setting framework used by teams and organizations'),
  ('Stakeholder Management','stakeholder-mgmt',      'Product & Management', '{}',                       'Managing relationships with project stakeholders effectively'),

  -- Soft Skills
  ('Communication',     'communication',     'Soft Skills', '{}',                                'Effectively conveying information verbally and in writing'),
  ('Problem Solving',   'problem-solving',   'Soft Skills', '{"Critical Thinking","Analytical Thinking"}', 'Breaking down complex problems and finding effective solutions'),
  ('Team Collaboration','team-collab',        'Soft Skills', '{"Teamwork"}',                     'Working effectively with others toward shared goals'),
  ('Public Speaking',   'public-speaking',   'Soft Skills', '{"Presentation Skills"}',           'Presenting ideas clearly and confidently to an audience'),
  ('Time Management',   'time-management',   'Soft Skills', '{}',                                'Planning and exercising control over time spent on activities'),
  ('Mentoring',         'mentoring',         'Soft Skills', '{"Coaching"}',                      'Guiding and supporting the development of others')
on conflict (slug) do nothing;
