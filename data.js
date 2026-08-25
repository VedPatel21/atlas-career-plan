(function () {
  'use strict';

  const STATUS = {
    PROVEN: 'already-proven',
    LIKELY: 'likely-proven',
    PARTIAL: 'partial',
    MISSING: 'missing',
    NOT_NEEDED: 'not-needed-yet',
    LOCKED: 'locked',
    OPTIONAL: 'optional'
  };

  const statusLabels = {
    'already-proven': 'Already proven',
    'likely-proven': 'Likely proven — verify once',
    'partial': 'Partial',
    'missing': 'Missing',
    'not-needed-yet': 'Not needed yet',
    'locked': 'Locked',
    'optional': 'Optional'
  };

  const progressLabels = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    'completed': 'Completed',
    'skipped': 'Skipped'
  };

  const capabilityGuidance = undefined;

  const taskExecutionGuidance = undefined;

  const labs = {
  "testing": {
    "title": "pytest Regression Protection Lab",
    "goal": "Write unit and failure-case tests that prevent real regression in an application service",
    "steps": [
      "Identify a core business logic function in your project (e.g. auth check, pricing formula, or data filter)",
      "Write a pytest test covering the expected valid input and output (happy path)",
      "Write tests covering at least 2 edge/failure cases (e.g. empty input, invalid format, missing field, permission failure)",
      "Deliberately modify application code to introduce a subtle bug and verify that pytest catches it immediately",
      "Add pytest-cov to measure line and branch test coverage across the tested module"
    ],
    "expectedResult": "Test suite runs in under 2 seconds, passes on good code, and fails with clear diagnostics on regressions.",
    "stretch": "Add a parameterized test with @pytest.mark.parametrize testing 5 distinct boundary inputs.",
    "completionCheck": "You can write unit/integration tests and fixtures for an API or library."
  },
  "docker": {
    "title": "Multi-Stage Containerization Lab",
    "goal": "Package a backend application into a minimal, reproducible Docker container",
    "steps": [
      "Create a .dockerignore file to exclude virtual environments, cache files, and sensitive credentials",
      "Write a Dockerfile with a clean base image (e.g. python:3.11-slim)",
      "Define WORKDIR, copy requirements.txt, install dependencies, and copy application source code",
      "Build the image using docker build -t my-service:v1 .",
      "Run the container with port binding and environment variables: docker run -p 8000:8000 --env-file .env my-service:v1",
      "Verify the running service via curl or browser and inspect container execution logs with docker logs"
    ],
    "expectedResult": "Application runs in the container identically to the host with zero host dependency leaks.",
    "stretch": "Write a docker-compose.yml file that launches the backend alongside a local PostgreSQL database container.",
    "completionCheck": "You can build an image, run the app in a container, configure ports/env variables, and debug basic container issues."
  },
  "basic-ci": {
    "title": "GitHub Actions Pull Request Gate Lab",
    "goal": "Automate linting and test execution on every pull request to protect main branch",
    "steps": [
      "Create .github/workflows/ci.yml in your repository root",
      "Configure triggers for push and pull_request on main branch",
      "Set up a runner job (ubuntu-latest) with actions/checkout and actions/setup-python",
      "Add steps to install dependencies, run linter (e.g. ruff/flake8), and run pytest",
      "Open a draft pull request with a failing test to verify the CI check turns red and blocks merge",
      "Fix the test and verify the CI check turns green before merging"
    ],
    "expectedResult": "GitHub PR shows automated status checks that reliably pass/fail based on code correctness.",
    "stretch": "Add caching for pip dependencies with actions/cache to accelerate CI workflow execution.",
    "completionCheck": "A pull request automatically runs tests/checks and blocks broken merges without manual intervention."
  },
  "dsa": {
    "title": "Algorithmic Problem-Solving & Complexity Lab",
    "goal": "Implement core data structures and analyze Big-O time and space complexity",
    "steps": [
      "Implement a Hash Map / Frequency Counter pattern to solve Two Sum or Group Anagrams",
      "Implement a Two-Pointer or Sliding Window pattern for substring/subarray optimization",
      "Implement a Tree Traversal (BFS and DFS) on a Binary Search Tree",
      "Write down the formal time and space complexity analysis for each solution",
      "Test solutions against empty, single-element, duplicate, and large inputs"
    ],
    "expectedResult": "Clean, idiomatic implementations that handle edge cases and execute within optimal Big-O bounds.",
    "stretch": "Explain the trade-offs between O(log N) and O(N) searching in sorted vs unsorted data.",
    "completionCheck": "You can identify common data structure patterns, explain time/space trade-offs, and solve representative problems."
  },
  "http-api": {
    "title": "HTTP Protocol & Reverse Proxy Inspection Lab",
    "goal": "Trace and dissect raw HTTP requests, status codes, headers, and reverse proxy routing",
    "steps": [
      "Use curl -v to inspect raw HTTP request and response headers for an API endpoint",
      "Implement semantic HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity, 500 Internal Error",
      "Configure Cache-Control headers and observe 304 Not Modified behavior with ETag / If-None-Match",
      "Configure a reverse proxy (Nginx or Caddy) to route requests, forward X-Forwarded-For headers, and terminate TLS",
      "Explain the relationship between DNS lookup, TCP 3-way handshake, TLS negotiation, and HTTP payload transfer"
    ],
    "expectedResult": "Full visibility into request/response lifecycle, header propagation, caching, and proxy behavior.",
    "stretch": "Simulate a network timeout or connection reset and verify client error handling.",
    "completionCheck": "You can trace HTTP/API requests, explain DNS/TCP/TLS/proxy roles, and configure headers, status codes, and error responses."
  },
  "relational-db": {
    "title": "PostgreSQL Schema, Constraints & EXPLAIN Lab",
    "goal": "Design normalized tables with foreign key constraints, ACID transactions, and query index optimization",
    "steps": [
      "Design a relational schema with at least 3 related tables with primary/foreign keys and NOT NULL / UNIQUE constraints",
      "Write a transaction block (BEGIN...COMMIT / ROLLBACK) that transfers ownership or logs an event atomically",
      "Write a complex SELECT query joining all 3 tables with filtering and aggregation",
      "Run EXPLAIN ANALYZE on the query to inspect sequential scans vs index scans",
      "Create a targeted B-tree index on a frequently filtered column and measure execution time drop with EXPLAIN ANALYZE"
    ],
    "expectedResult": "Data integrity is enforced at the database level and queries execute with efficient index scans.",
    "stretch": "Implement a database migration script that safely adds a column with a default value without locking large tables.",
    "completionCheck": "You can design relational schemas, write multi-table joins, enforce constraints/transactions, and optimize queries with EXPLAIN."
  },
  "backend": {
    "title": "FastAPI Service Architecture & Validation Lab",
    "goal": "Build a modular, validated backend API service with dependency injection and error handling",
    "steps": [
      "Structure a FastAPI project with routers, schemas, services, and models in separate directories",
      "Define request and response schemas using Pydantic with strict field validation and documentation",
      "Implement dependency injection for database sessions and authentication tokens",
      "Implement a global exception handler that returns structured, consistent JSON error responses",
      "Write integration tests covering happy paths, authentication failures, and validation errors"
    ],
    "expectedResult": "A clean, modular API service with auto-generated Swagger docs (/docs) and robust error handling.",
    "stretch": "Add rate limiting or request ID middleware to trace incoming requests.",
    "completionCheck": "You can build and structure a validated, tested backend API service with clean boundaries and database access."
  },
  "python-engineering": {
    "title": "Professional Python Package & Virtual Environment Lab",
    "goal": "Structure a Python application with clean imports, type hints, and isolated virtual environment",
    "steps": [
      "Create an isolated virtual environment using venv and pin dependencies with exact versions in requirements.txt",
      "Organize code into a clean package structure with __init__.py files and absolute imports",
      "Add type hints to all function signatures and verify type correctness using mypy",
      "Configure pyproject.toml / ruff for automatic code formatting and linting",
      "Execute the application via a modular entry point (e.g. python -m my_package.main)"
    ],
    "expectedResult": "A cleanly packaged Python repository that installs and executes deterministically across machines.",
    "stretch": "Build a distribution wheel using python -m build and install it in a clean environment.",
    "completionCheck": "You can organize Python code with virtual environments, type hints, linters, and clean package structure."
  },
  "git-workflow": {
    "title": "Feature Branching, Rebase & Pull Request Lab",
    "goal": "Practice professional Git workflow: feature branches, atomic commits, rebasing, and PR review hygiene",
    "steps": [
      "Create a feature branch from main (git checkout -b feature/user-auth)",
      "Make small, atomic commits with descriptive conventional commit messages (feat: add password hashing)",
      "Simulate a team merge on main and rebase your feature branch cleanly (git fetch origin && git rebase origin/main)",
      "Resolve any merge conflicts deliberately, verifying code integrity after conflict resolution",
      "Open a pull request with a structured description: Problem, Solution, Verification, and Risk"
    ],
    "expectedResult": "A clean linear commit history and a high-signal pull request suitable for team review.",
    "stretch": "Perform an interactive rebase (git rebase -i) to squash typo/fixup commits into clean units.",
    "completionCheck": "You can use feature branches, rebase cleanly, resolve conflicts, and submit review-ready pull requests."
  },
  "debugging": {
    "title": "Systematic Bug Isolation & Root Cause Lab",
    "goal": "Reproduce a difficult failure, isolate root cause with a debugger, and implement regression test",
    "steps": [
      "Create a minimal reproducible example (MRE) that triggers the bug consistently",
      "Use the Python interactive debugger (pdb / breakpoint() / VS Code debugger) to step through variables",
      "Formulate and test explicit hypotheses about the failure cause before making code edits",
      "Implement the minimal fix that addresses the root cause rather than masking symptoms",
      "Write an automated regression test that fails before the fix and passes after the fix"
    ],
    "expectedResult": "A permanent bug fix accompanied by an automated regression test that prevents recurrence.",
    "stretch": "Write a short post-mortem explaining the bug mechanics, blast radius, and preventive measures.",
    "completionCheck": "You can systematically isolate bugs using debuggers/logs, identify root causes, and write regression tests."
  },
  "code-quality": {
    "title": "Automated Linting, Formatting & Type Checking Lab",
    "goal": "Set up an automated quality gate with Ruff, Black, and Mypy in pre-commit hooks",
    "steps": [
      "Install and configure Ruff for ultra-fast linting and code formatting",
      "Configure Mypy with strict type checking options in pyproject.toml",
      "Install pre-commit and create a .pre-commit-config.yaml running linters and formatters on git commit",
      "Run pre-commit run --all-files across the repository and resolve all flagged issues",
      "Verify that attempting to commit unformatted or ill-typed code is automatically blocked"
    ],
    "expectedResult": "Automated local and CI enforcement ensuring 100% compliant code style and type safety.",
    "stretch": "Add a static security analysis check (e.g. bandit) to the pre-commit configuration.",
    "completionCheck": "You can configure and enforce automated linters, formatters, and type checkers across a repository."
  },
  "linux-cli": {
    "title": "Linux Shell Navigation, Processes & Logs Lab",
    "goal": "Inspect running processes, analyze system logs, and manage permissions from the terminal",
    "steps": [
      "Navigate directories, search file contents using grep / ripgrep, and manipulate text with awk/sed",
      "Inspect running processes using ps aux, top, and kill; inspect open ports using netstat / lsof -i",
      "Manage file permissions and ownership using chmod and chown",
      "Tail and filter real-time application logs using tail -f and grep",
      "Write a multi-line Bash shell script that automates a diagnostic check and exits with appropriate exit codes"
    ],
    "expectedResult": "Fluent command-line proficiency for server inspection, process management, and log debugging.",
    "stretch": "Write a cron job or systemd service unit file that runs a background health check.",
    "completionCheck": "You can navigate Linux, inspect processes, manage permissions, and diagnose logs via the shell."
  },
  "linear-algebra": {
    "title": "Vector Space & Matrix Transformations Lab",
    "goal": "Implement and visualize vector transformations, dot products, and cosine similarity in NumPy",
    "steps": [
      "Create 2D/3D vectors in NumPy and compute vector norms and scalar multiples",
      "Implement cosine similarity from scratch using dot products and norms",
      "Create a 2x2 transformation matrix (rotation/scaling) and apply it to a grid of coordinates",
      "Compute the determinant and explain whether the transformation preserves orientation and area",
      "Compute eigenvalues and eigenvectors using numpy.linalg.eig and explain their geometric meaning"
    ],
    "expectedResult": "Accurate numerical calculations paired with geometric intuition for similarity and projection.",
    "stretch": "Compute cosine similarity between 5 sample text embedding vectors and find the nearest neighbor.",
    "completionCheck": "You can explain vectors as representations, compute dot product / cosine similarity, and understand matrix transformations in ML."
  },
  "probability-statistics": {
    "title": "Statistical Reasoning & Uncertainty Lab",
    "goal": "Calculate confidence intervals, evaluate sample variance, and test hypotheses on experimental data",
    "steps": [
      "Generate synthetic metric data with known distribution parameters (mean and standard deviation)",
      "Calculate sample mean, standard error, and 95% confidence interval for different sample sizes (N=10 vs N=1000)",
      "Perform a two-sample t-test comparing model A vs model B accuracy across multiple cross-validation folds",
      "Identify a case of Simpson's Paradox or confounding variable in a sample dataset",
      "Write a short interpretation explaining whether a 1% metric improvement is statistically significant or noise"
    ],
    "expectedResult": "Clear understanding of variance, sample size effects, p-values, and evaluation reliability.",
    "stretch": "Calculate Precision, Recall, and F1-score across different classification threshold cutoffs.",
    "completionCheck": "You can apply statistical reasoning to model evaluation, uncertainty, sampling variance, and metric significance."
  },
  "calculus-optimization": {
    "title": "Gradient Descent Optimization Lab",
    "goal": "Implement gradient descent from scratch in Python to minimize a loss function",
    "steps": [
      "Define a simple quadratic loss function (e.g. f(w) = (w - 3)^2 + 4) and its analytical derivative",
      "Implement the gradient descent update rule: w = w - lr * grad in a loop for 50 steps",
      "Observe and plot the convergence path for different learning rates (lr=0.01, lr=0.1, lr=1.1 causing divergence)",
      "Extend the function to two variables (f(w1, w2)) and compute partial derivatives",
      "Implement Momentum or Adam optimizer update rule and compare convergence speed against vanilla SGD"
    ],
    "expectedResult": "Visual and numerical proof of convergence to minimum and understanding of learning rate sensitivity.",
    "stretch": "Plot the loss surface and trajectory of optimization in 3D.",
    "completionCheck": "You can explain partial derivatives, compute gradients, and debug gradient-based optimization behavior."
  },
  "numpy": {
    "title": "NumPy Vectorization & Broadcasting Lab",
    "goal": "Eliminate Python loops by writing high-performance vectorized array operations",
    "steps": [
      "Create multi-dimensional arrays and inspect their shape, dtype, strides, and memory layout",
      "Perform array slicing, boolean masking, and fancy indexing without modifying original data",
      "Implement batch matrix multiplication using broadcasting rules without nested loops",
      "Benchmark a vectorized NumPy calculation vs a pure Python for-loop (demonstrating 50x+ speedup)",
      "Implement standard normalization (Z-score scaling) across 2D feature matrix in one line of NumPy"
    ],
    "expectedResult": "Loop-free, fast numerical array operations utilizing NumPy SIMD vectorization.",
    "stretch": "Implement a vectorized Euclidean distance matrix calculation between two sets of points.",
    "completionCheck": "You can use NumPy array indexing, slicing, broadcasting, and vectorization competently in ML code."
  },
  "pandas-eda": {
    "title": "Exploratory Data Analysis & Cleaning Lab",
    "goal": "Clean raw dataset, engineer features, and visualize data distributions without data leakage",
    "steps": [
      "Load raw tabular data with missing values, inconsistent formats, and outliers",
      "Perform data cleaning: impute or drop missing values with justification, parse dates, cast types",
      "Compute summary statistics (median, IQR, skewness) and identify outlier distributions",
      "Generate correlation matrix and feature distribution plots (histograms, box plots)",
      "Document key domain findings and potential data collection biases before modeling"
    ],
    "expectedResult": "A clean, reproducible EDA notebook with explicit data validation and documented insights.",
    "stretch": "Write automated data validation assertions using pandas or Great Expectations.",
    "completionCheck": "You can clean, explore, and analyze datasets with statistics and visualization while documenting data assumptions."
  },
  "data-quality": {
    "title": "Leakage Audit & Data Validation Pipeline Lab",
    "goal": "Build a reproducible data preprocessing pipeline with strict train/val/test separation and leakage checks",
    "steps": [
      "Split raw data into Train (70%), Validation (15%), and Test (15%) BEFORE any preprocessing or scaling",
      "Fit preprocessors (scalers, encoders) ONLY on the training split, and transform val/test splits",
      "Perform an explicit leakage audit checking for temporal leakage, target proxy leakage, and group overlap",
      "Write schema validation checks that raise errors if input data types or ranges violate assumptions",
      "Measure model performance drop when intentional target leakage is removed to see true generalization"
    ],
    "expectedResult": "A zero-leakage, reproducible data pipeline where train/test isolation is strictly verified.",
    "stretch": "Implement a scikit-learn ColumnTransformer and Pipeline to bundle preprocessing and estimator.",
    "completionCheck": "You can design reproducible data pipelines with strict split isolation, validation checks, and leakage audits."
  },
  "ml-problem-framing": {
    "title": "ML Problem Definition & Baseline Lab",
    "goal": "Frame a real-world predictive task, define metrics, and establish a simple heuristic baseline",
    "steps": [
      "State the user/business decision, the exact prediction target (y), and available input features (X)",
      "Quantify the cost asymmetry of errors (e.g. False Positive vs False Negative cost)",
      "Select the primary evaluation metric (e.g. PR-AUC, F1-macro, MAE) and explain why Accuracy is insufficient",
      "Implement the simplest possible baseline (e.g. majority class classifier, mean predictor, or simple rule)",
      "Measure the baseline performance on the validation set as the benchmark to beat"
    ],
    "expectedResult": "A written one-page problem framing and code baseline that sets the standard for ML evaluation.",
    "stretch": "Add a simple linear model baseline to compare against the heuristic.",
    "completionCheck": "You can define a measurable ML problem target, choose appropriate metrics, and build a credible baseline."
  },
  "ml-data-splits": {
    "title": "Leakage-Safe Data Split Strategy Lab",
    "goal": "Implement and justify random, temporal, or grouped data splitting strategies",
    "steps": [
      "Inspect dataset structure for temporal dependencies (time series) or entity clustering (users/devices)",
      "Implement StratifiedKFold for imbalanced classification OR TimeSeriesSplit for temporal data",
      "Verify that no single entity or group appears in both train and validation folds",
      "Calculate distribution statistics across folds to ensure balance and consistency",
      "Write an automated assertion verifying zero intersection between train and test IDs"
    ],
    "expectedResult": "Splits that faithfully simulate production deployment conditions without overestimating performance.",
    "stretch": "Simulate a production drift scenario by evaluating on an out-of-time test split.",
    "completionCheck": "You can choose and implement appropriate split strategies (random, stratified, grouped, time-based) without leakage."
  },
  "ml-models": {
    "title": "Model Breadth & Comparison Lab",
    "goal": "Train, tune, and compare linear models, decision trees, and gradient boosted ensembles",
    "steps": [
      "Train a Logistic Regression / Ridge Regression baseline model on preprocessed features",
      "Train a Random Forest classifier/regressor and inspect feature importances",
      "Train a Gradient Boosted Tree (XGBoost / LightGBM) with hyperparameter tuning",
      "Evaluate all models using cross-validation on identical validation folds",
      "Compare models across accuracy, interpretability, training time, and inference latency"
    ],
    "expectedResult": "A structured model comparison table showing trade-offs between linear, tree, and ensemble methods.",
    "stretch": "Calibrate model prediction probabilities using CalibratedClassifierCV.",
    "completionCheck": "You can train, tune, and compare multiple classical ML models (linear, tree-based, ensembles) with justified trade-offs."
  },
  "ml-evaluation": {
    "title": "Error Analysis & Slice Evaluation Lab",
    "goal": "Dissect model failures, analyze error slices, and evaluate stability beyond single aggregate metrics",
    "steps": [
      "Generate a confusion matrix and classification report across all classes",
      "Plot precision-recall curves and ROC curves, selecting an optimal classification threshold",
      "Create a failure taxonomy: inspect top 20 worst false positive and false negative predictions",
      "Slice evaluation metrics across sub-populations or feature categories to detect hidden disparities",
      "Write an error analysis memo detailing what would make the model untrustworthy in production"
    ],
    "expectedResult": "Deep understanding of where and why the model fails, rather than relying on a single top-level score.",
    "stretch": "Use SHAP or tree feature importance to explain the top 5 erroneous predictions.",
    "completionCheck": "You can perform rigorous metric selection, threshold tuning, error slice analysis, and model diagnosis."
  },
  "ml-reproducibility": {
    "title": "Deterministic ML Experiment Lab",
    "goal": "Make data preprocessing, configuration, random seeds, and training runs 100% reproducible",
    "steps": [
      "Set all random seeds (random, numpy, model) to a deterministic value",
      "Extract all hyperparameters, file paths, and feature names into a YAML/JSON configuration file",
      "Write a clean CLI entrypoint (python train.py --config config.yaml) that runs the complete pipeline",
      "Save versioned model artifacts and recorded evaluation metrics to a structured output folder",
      "Run the script twice in a fresh environment and assert that output metrics and model weights match exactly"
    ],
    "expectedResult": "Anyone can clone the repository, run one command, and reproduce identical experiment results.",
    "stretch": "Containerize the training script using Docker for complete OS/dependency determinism.",
    "completionCheck": "You can structure versioned code, config, and deterministic scripts to reproduce training and results from scratch."
  },
  "experiment-tracking": {
    "title": "MLflow Experiment Tracking Lab",
    "goal": "Track hyperparameters, training metrics over epochs, and model artifacts with MLflow",
    "steps": [
      "Install MLflow and launch a local tracking server (mlflow ui)",
      "Wrap training code with mlflow.start_run(), logging parameters (learning_rate, max_depth, n_estimators)",
      "Log metrics at each epoch/iteration (loss, accuracy, validation score) using mlflow.log_metric()",
      "Log model artifacts, feature lists, and confusion matrix plots using mlflow.log_artifact()",
      "Register the best-performing model to the MLflow Model Registry with a version tag"
    ],
    "expectedResult": "A searchable, visual MLflow dashboard recording all experiment runs, parameters, and artifact versions.",
    "stretch": "Compare 5 different training runs side-by-side in MLflow UI to select the production candidate.",
    "completionCheck": "You can track experiments, log metrics/params, version model artifacts, and compare runs using MLflow."
  },
  "ml-pipelines": {
    "title": "Modular ML Training Pipeline Lab",
    "goal": "Refactor notebook code into modular, production-ready pipeline components with schema validation and lineage",
    "steps": [
      "Break ML code into distinct modules: data_loader.py, preprocessor.py, trainer.py, evaluator.py",
      "Add input/output data schema validation and lineage tracking at each pipeline boundary",
      "Implement structured logging (logging module) instead of print statements",
      "Handle exceptions and data errors gracefully with informative error messages",
      "Create an orchestrator script that executes the stages in sequence and generates a validation report"
    ],
    "expectedResult": "A clean Python package with repeatable training, error handling, schema validation, and separation of concerns.",
    "stretch": "Add automated unit tests covering the preprocessor and feature transformations.",
    "completionCheck": "You can turn notebook code into a clean, modular Python pipeline with validation and error handling."
  },
  "model-serving": {
    "title": "FastAPI Model Inference Service Lab",
    "goal": "Serve a trained ML model behind a validated, low-latency REST API with batch prediction",
    "steps": [
      "Load the trained model artifact into memory on FastAPI startup",
      "Define request and response schemas using Pydantic for single and batch predictions",
      "Implement input data preprocessing inside the API handler before passing to model.predict()",
      "Add health check (/health) and model metadata (/info) endpoints",
      "Measure P50, P95, and P99 inference latency under concurrent simulated requests"
    ],
    "expectedResult": "A responsive API that validates incoming requests, predicts in <50ms, and returns structured JSON.",
    "stretch": "Implement asynchronous batch inference for high-throughput workloads.",
    "completionCheck": "You can build and deploy a tested model serving API with input validation, health checks, and latency profiling."
  },
  "ml-deployment": {
    "title": "Dockerized ML Deployment & CI/CD Lab",
    "goal": "Package the model service into a Docker container and automate deployment with GitHub Actions",
    "steps": [
      "Write a Dockerfile that copies the model artifact, dependencies, and FastAPI server",
      "Build and run the container locally, validating predictions against the containerized endpoint",
      "Write a GitHub Actions workflow that runs linting, unit tests, and builds the Docker image on PR",
      "Push the container image to a container registry (GitHub Packages / Docker Hub)",
      "Deploy the container to a cloud host (e.g. Render, Railway, or AWS EC2/ECS) and verify live DNS/HTTP access"
    ],
    "expectedResult": "A fully automated pipeline where committing code updates the running production model service.",
    "stretch": "Add a post-deployment health check step in GitHub Actions that rolls back if /health fails.",
    "completionCheck": "You can containerize, automate CI/CD checks, and deploy an ML service to a real host environment."
  },
  "ml-monitoring": {
    "title": "Model Health & Data Drift Monitoring Lab",
    "goal": "Log prediction telemetry, monitor latency/errors, and detect data distribution drift",
    "steps": [
      "Add middleware to log every incoming inference request, response, latency, and status code to JSON logs",
      "Expose a /metrics endpoint with Prometheus counters for total requests, errors, and latency histograms",
      "Implement a data drift check (e.g. using Evidently or PSI calculation) comparing production inputs to training baseline",
      "Trigger an alert or warning when input distribution deviates significantly from training baseline",
      "Draft a written model retraining runbook describing when and how to update the model in production"
    ],
    "expectedResult": "Live telemetry and drift awareness that detects performance degradation before users report errors.",
    "stretch": "Visualize latency and request count metrics using a local Grafana dashboard.",
    "completionCheck": "You can observe service latency/errors, monitor input data drift, and establish a retraining strategy."
  },
  "dl-mechanics": {
    "title": "Micrograd: Autograd & Neural Network Mechanics Lab",
    "goal": "Build a tiny computational graph and autograd backpropagation engine from scratch in Python",
    "steps": [
      "Build a Value class that stores scalar data and pointers to children nodes",
      "Implement forward arithmetic operations (+, *, tanh, relu) with backward gradient closures",
      "Implement the topological sort and recursive .backward() method for reverse-mode automatic differentiation",
      "Build a 2-layer Multi-Layer Perceptron (Neuron, Layer, MLP) using the Value class",
      "Train the MLP on a small binary classification dataset (e.g. XOR) using manual gradient descent loops"
    ],
    "expectedResult": "The custom MLP successfully minimizes loss and classifies XOR data using your own autograd engine.",
    "stretch": "Add L2 regularization (weight decay) to the loss computation in your autograd engine.",
    "completionCheck": "You can explain forward passes, write autograd backprop math, and diagnose neural network training mechanics."
  },
  "pytorch": {
    "title": "PyTorch Model Construction & Training Loop Lab",
    "goal": "Construct, train, evaluate, and save a neural network in PyTorch using proper modular design",
    "steps": [
      "Create custom Dataset and DataLoader classes with batching, shuffling, and data transforms",
      "Define a custom neural network architecture by subclassing torch.nn.Module with forward() pass",
      "Implement the complete training loop: model.train(), optimizer.zero_grad(), loss.backward(), optimizer.step()",
      "Implement the evaluation loop: model.eval(), with torch.no_grad(), computing validation metrics",
      "Implement checkpoint saving and loading (torch.save / torch.load) with model state_dict and optimizer state"
    ],
    "expectedResult": "A robust PyTorch training script that tracks training/validation loss curves and saves best checkpoints.",
    "stretch": "Train the model on GPU/MPS device with device-agnostic code (torch.device(\"cuda\" if ... else \"mps\" if ... else \"cpu\")).",
    "completionCheck": "You can construct, train, evaluate, checkpoint, and debug a real PyTorch model on custom data."
  },
  "dl-debugging": {
    "title": "Deep Learning Training Diagnostics Lab",
    "goal": "Identify and fix exploding/vanishing gradients, overfit/underfit, bad learning rates, and eval mode bugs",
    "steps": [
      "Deliberately induce gradient explosion/vanishing by setting extreme weight initialization or learning rates",
      "Plot gradient norms across layers during training to detect vanishing gradients",
      "Add Gradient Clipping (torch.nn.utils.clip_grad_norm_) and Batch Normalization to stabilize training",
      "Test the \"overfit a single batch\" diagnostic technique: verify your model can reach 100% accuracy on 10 examples",
      "Diagnose an evaluation bug by comparing model output with model.eval() vs model.train() when using Dropout/BatchNorm"
    ],
    "expectedResult": "A documented training diagnostic journal showing before-and-after curves for each fixed issue.",
    "stretch": "Implement Learning Rate Scheduling (e.g. CosineAnnealingLR) and compare convergence.",
    "completionCheck": "You can diagnose and resolve exploding/vanishing gradients, overfit, learning rate issues, and eval mode bugs."
  },
  "embeddings-attention": {
    "title": "Embeddings & Multi-Head Self-Attention Lab",
    "goal": "Implement scaled dot-product self-attention and positional embeddings from scratch in PyTorch",
    "steps": [
      "Create an embedding layer (nn.Embedding) that maps token IDs to dense vector representations",
      "Implement sinusoidal positional encoding or learned positional embeddings to provide sequence position",
      "Implement Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V",
      "Implement causal masking (tril mask) to prevent attention from looking at future tokens",
      "Assemble a Multi-Head Attention block with projection layers and verify output tensor shapes"
    ],
    "expectedResult": "Multi-Head Attention block takes batch of token embeddings and returns context-aware representations.",
    "stretch": "Compare your custom self-attention output with torch.nn.MultiheadAttention to ensure numerical equivalence.",
    "completionCheck": "You can implement and explain embeddings, scaled dot-product attention, causal masking, and transformer blocks."
  },
  "local-llm": {
    "title": "Local Model Inference & Quantization Lab",
    "goal": "Run local open-source LLMs (Qwen/Llama) on Apple Silicon / local hardware with memory and latency profiling",
    "steps": [
      "Load a quantized model (e.g. 4-bit / 8-bit GGUF via llama.cpp or Ollama / MLX)",
      "Measure RAM/VRAM usage, time-to-first-token (TTFT), and tokens-per-second generation speed",
      "Implement structured output generation (JSON mode) using schema constraints or grammars",
      "Benchmark generation quality and memory footprint across different quantization levels (Q4_K_M vs Q8_0 vs FP16)",
      "Document performance trade-offs and hardware constraints for local vs cloud API hosting"
    ],
    "expectedResult": "A working local inference system with measured memory, latency, and reliable structured outputs.",
    "stretch": "Implement prompt caching to reduce time-to-first-token on multi-turn conversations.",
    "completionCheck": "You can run local LLMs, profile memory/latency trade-offs, and generate reliable structured outputs."
  },
  "transformers": {
    "title": "Transformer Tokenization & KV Cache Lab",
    "goal": "Build a Byte-Pair Encoding (BPE) tokenizer and trace KV cache memory scaling in LLMs",
    "steps": [
      "Train a simple BPE tokenizer on sample text and inspect the resulting vocabulary and merge rules",
      "Encode text to token IDs and decode back, verifying lossless round-trip reconstruction",
      "Trace the tensor dimensions through a transformer forward pass (Batch, Seq_Len, D_Model, Num_Heads, Head_Dim)",
      "Implement a simple Key-Value (KV) cache for autoregressive generation and observe token generation speedup",
      "Calculate the KV cache memory formula: 2 * num_layers * num_heads * head_dim * seq_len * precision_bytes"
    ],
    "expectedResult": "Clear mathematical and code understanding of tokenization, attention tensors, and KV cache memory costs.",
    "stretch": "Simulate context length scaling from 2K to 32K tokens and plot KV cache memory requirements.",
    "completionCheck": "You can explain tokenization, attention mechanisms, pretraining vs fine-tuning, and KV cache scaling."
  },
  "llm-inference": {
    "title": "LLM Sampling, Temperature & Context Scaling Lab",
    "goal": "Implement sampling strategies (greedy, top-k, top-p, temperature) and benchmark context limits",
    "steps": [
      "Implement logit sampling functions: Greedy search, Temperature scaling, Top-K filtering, Top-P (nucleus) sampling",
      "Test how Temperature (0.0 vs 0.7 vs 1.5) affects output determinism, creativity, and hallucination rate",
      "Implement system prompts and conversation history truncation strategies (sliding window vs summary buffer)",
      "Measure degradation in model recall as context length increases (\"Lost in the Middle\" phenomenon)",
      "Implement structured Pydantic response parsing with automated retry on JSON parse failure"
    ],
    "expectedResult": "A robust generation harness with configurable sampling parameters and validated structured responses.",
    "stretch": "Implement speculative decoding with a small draft model and large target model to accelerate inference.",
    "completionCheck": "You can configure sampling parameters, manage context windows, and enforce structured JSON outputs."
  },
  "retrieval-rag": {
    "title": "Production Hybrid RAG & Vector Retrieval Lab",
    "goal": "Build and evaluate a hybrid retrieval system combining BM25 keyword search and dense vector embeddings",
    "steps": [
      "Parse and chunk a document corpus using semantic/recursive character chunking with overlap",
      "Generate dense vector embeddings and store in a vector index",
      "Build a BM25 sparse lexical index over the same chunked corpus",
      "Implement Reciprocal Rank Fusion (RRF) to combine lexical and dense retrieval rankings",
      "Apply a Cross-Encoder Reranker model (e.g. bge-reranker) to re-score the top 20 candidate chunks",
      "Evaluate retrieval hit rate and Mean Reciprocal Rank (MRR) on a test set of 20 realistic queries"
    ],
    "expectedResult": "Hybrid retrieval with reranking achieves higher recall and precision than naive vector search alone.",
    "stretch": "Measure latency and accuracy trade-offs before and after adding the cross-encoder reranker.",
    "completionCheck": "You can build and evaluate hybrid retrieval (lexical + dense) with chunking, reranking, and retrieval metrics."
  },
  "agents": {
    "title": "Tool-Calling ReAct Agent Loop Lab",
    "goal": "Implement a model-driven ReAct (Reason + Act) loop with structured tool execution and observation parsing",
    "steps": [
      "Define a tool registry with typed JSON schemas (e.g. search_db, calculate, execute_query)",
      "Implement the agent loop: Prompt with available tools → Parse tool call → Execute tool safely → Append observation → Repeat",
      "Implement loop termination conditions: Max iterations, task completion detection, and error budget",
      "Add tool execution sandboxing and input validation to prevent arbitrary code or command execution",
      "Evaluate agent trajectory on 5 multi-step tasks, recording success rate, step count, and tool errors"
    ],
    "expectedResult": "A reliable autonomous agent loop that calls tools, handles observation errors, and reaches goals.",
    "stretch": "Implement human-in-the-loop approval before executing sensitive tool actions (e.g. delete/modify).",
    "completionCheck": "You can build an agent loop with typed tool contracts, error handling, and trajectory evaluation."
  },
  "mcp": {
    "title": "Model Context Protocol (MCP) Server & Client Lab",
    "goal": "Implement a standard Model Context Protocol (MCP) server exposing tools and data resources",
    "steps": [
      "Build an MCP server using the official MCP SDK exposing at least 2 tools (e.g. query_system, fetch_logs)",
      "Define JSON-RPC schemas for tool arguments and return structures",
      "Implement secure input validation and authentication on the MCP server",
      "Connect an MCP client host (e.g. Claude Desktop or custom client) to your MCP server",
      "Verify tool discovery, invocation, and response exchange over standard MCP transport (stdio/SSE)"
    ],
    "expectedResult": "A compliant MCP server that seamlessly exposes capabilities to any MCP-compatible AI host.",
    "stretch": "Implement dynamic MCP resource streaming for large dataset inspection.",
    "completionCheck": "You can design, build, and secure an MCP server/client interface exposing tools and data resources."
  },
  "context-engineering": {
    "title": "Context Optimization & Token Efficiency Lab",
    "goal": "Engineer structured context prompts that maximize task accuracy while minimizing token cost and latency",
    "steps": [
      "Benchmark a naive \"dump everything\" prompt vs a curated \"just-in-time\" retrieved context prompt",
      "Implement context pruning: strip unnecessary whitespace, comments, and irrelevant metadata from documents",
      "Structure context using clear semantic XML tags (<document>, <instructions>, <tools>, <examples>)",
      "Measure token count reduction and latency savings across 20 test inputs",
      "Verify that pruned context maintains or improves downstream task accuracy against the naive baseline"
    ],
    "expectedResult": "Measurable 40%+ token reduction and faster response times with zero loss in task accuracy.",
    "stretch": "Implement dynamic few-shot example selection based on semantic similarity to the incoming prompt.",
    "completionCheck": "You can structure, filter, and optimize prompt context to improve accuracy and token efficiency."
  },
  "llm-evals": {
    "title": "LLM Regression Suite & Evaluation Harness Lab",
    "goal": "Build an automated evaluation dataset and regression test suite for LLM and RAG outputs",
    "steps": [
      "Assemble an evaluation dataset of 25+ representative input queries with ground-truth reference outputs",
      "Implement deterministic assertions: regex matches, JSON schema validity, required key presence, and forbidden terms",
      "Implement semantic evaluation metrics: BLEU/ROUGE, cosine similarity against ground truth, and LLM-as-a-judge with rubrics",
      "Run the evaluation suite against baseline system and record benchmark scores (accuracy, latency, cost)",
      "Make a prompt or model change, re-run the evaluation suite, and verify that regressions are immediately identified"
    ],
    "expectedResult": "An automated CI-style test suite that prevents silent quality degradation on model or prompt updates.",
    "stretch": "Implement G-Eval style pairwise comparison with calibrated scoring criteria.",
    "completionCheck": "You can build evaluation datasets, automated regression test suites, and measure system accuracy and failure rates."
  },
  "ai-observability": {
    "title": "AI Trace & Latency Attribution Lab",
    "goal": "Instrument an LLM/RAG pipeline with distributed tracing to attribute latency, costs, and failures",
    "steps": [
      "Instrument the RAG/Agent pipeline with OpenTelemetry or Langfuse/Arize tracing",
      "Trace every step of a request: User Query → Retrieval (latency) → Model Call (tokens + latency) → Tool Execution",
      "Log prompt inputs, raw completions, token counts, and cost estimates per request with a correlation ID",
      "Simulate a slow database query or model rate limit and locate the bottleneck in the trace waterfall",
      "Set up an alert threshold for requests exceeding latency budgets or failing with unhandled exceptions"
    ],
    "expectedResult": "Full visibility into multi-step AI execution with exact time and cost breakdowns per component.",
    "stretch": "Tag traces with user feedback (thumbs up/down) to connect operational traces with user satisfaction.",
    "completionCheck": "You can trace requests across retrieval, model calls, and tools to identify bottlenecks and failure causes."
  },
  "ai-reliability": {
    "title": "Resilience, Retries & Fallback Strategy Lab",
    "goal": "Implement circuit breakers, exponential backoff, model fallbacks, and caching for AI services",
    "steps": [
      "Implement exponential backoff with jitter for handling HTTP 429 (Rate Limit) and 503 errors",
      "Implement a secondary model fallback: if primary model times out or errors, automatically failover to backup model",
      "Implement semantic caching for repeated queries to return cached responses with 0 model cost and <10ms latency",
      "Implement graceful degradation: return partial answers or heuristic responses when downstream APIs fail completely",
      "Test resilience by injecting synthetic network delays and provider errors (chaos testing)"
    ],
    "expectedResult": "The service maintains availability and returns bounded responses even during complete provider outages.",
    "stretch": "Implement an adaptive rate limiter that dynamically throttles requests before hitting provider rate limits.",
    "completionCheck": "You can implement timeouts, retries, fallbacks, caching, and graceful degradation for resilient AI systems."
  },
  "ai-security": {
    "title": "AI Threat Modeling & Injection Defense Lab",
    "goal": "Threat-model an AI system and implement defenses against prompt injection and tool privilege escalation",
    "steps": [
      "Construct a threat model identifying attack vectors: direct prompt injection, indirect injection via data, data exfiltration",
      "Implement input sanitization and delimiters separating system instructions from untrusted user/document inputs",
      "Implement tool permission scoping: ensure read-only tools cannot perform state-modifying actions",
      "Test attack payloads (jailbreaks, instruction overrides, delimiter escaping) and verify defenses block them",
      "Implement output validation to prevent the model from executing dangerous shell commands or exposing API keys"
    ],
    "expectedResult": "A defended system that safely isolates user inputs and restricts tool actions to least-privilege boundaries.",
    "stretch": "Implement an automated security regression test that runs known injection payloads on every build.",
    "completionCheck": "You can threat-model an AI application, enforce tool permissions, and defend against prompt injection."
  },
  "ai-economics": {
    "title": "Latency, Cost & Token Economics Lab",
    "goal": "Profile, benchmark, and optimize token usage, model tiering, and dollar costs across application traffic",
    "steps": [
      "Calculate unit economics: cost per 1,000 requests across different model tiers (e.g. flagship vs small model)",
      "Implement model tiering: route simple classification queries to a fast/cheap model and complex reasoning to a larger model",
      "Benchmark response streaming (SSE) to reduce perceived user latency (Time-to-First-Token < 500ms)",
      "Measure monthly projected costs under 10k, 100k, and 1M monthly active requests",
      "Document trade-offs: quality delta vs cost multiplier when upgrading or downgrading models"
    ],
    "expectedResult": "A documented economic model and routing system that reduces production cost by 60%+ without sacrificing quality.",
    "stretch": "Implement prompt compression or token caching to minimize input token billing on repetitive prompts.",
    "completionCheck": "You can measure latency, throughput, token consumption, and model costs to optimize production trade-offs."
  },
  "feedback-loops": {
    "title": "Production Incident to Regression Eval Loop Lab",
    "goal": "Turn production edge-case failures into permanent evaluation test cases and verify system improvements",
    "steps": [
      "Capture a real or simulated production failure (e.g. model hallucination, bad retrieval chunk, tool failure)",
      "Analyze root cause: Was it retrieval deficiency, ambiguous prompt, model limitation, or bad tool output?",
      "Add the failing query and expected correct behavior to the versioned evaluation dataset",
      "Implement a targeted fix (e.g. prompt constraint, reranker adjustment, or tool validation)",
      "Re-run the entire evaluation suite to prove the failure is fixed AND no other test cases regressed"
    ],
    "expectedResult": "A closed-loop engineering workflow where every production failure permanently strengthens the system.",
    "stretch": "Automate the ingestion of negative user feedback into candidate eval cases.",
    "completionCheck": "You can turn production failures into regression eval cases and prove improvements without quality regressions."
  },
  "production-deployment": {
    "title": "Production Staging Deployment & Runbook Lab",
    "goal": "Deploy a containerized application to a cloud host with environment secrets, health checks, and rollback plan",
    "steps": [
      "Configure environment variables and secrets using a secrets manager or cloud environment settings (never committed to git)",
      "Deploy the containerized service to a cloud provider (e.g. Render, AWS App Runner, Fly.io, or DigitalOcean)",
      "Configure automated health check monitoring (/health) and restart policies on failure",
      "Write a one-page Operational Runbook detailing: deployment steps, log inspection, restart procedures, and rollback command",
      "Simulate a failed deployment and execute a clean rollback to the previous working version in under 2 minutes"
    ],
    "expectedResult": "A live, publicly accessible, secure service with a verified operational rollback procedure.",
    "stretch": "Set up custom domain with automated TLS/HTTPS certificate renewal.",
    "completionCheck": "You can deploy a containerized service with secrets, health checks, monitoring, and documented rollback."
  },
  "system-design": {
    "title": "System Architecture Design & Bottleneck Lab",
    "goal": "Design an end-to-end distributed system architecture document analyzing data flow, bottlenecks, and trade-offs",
    "steps": [
      "Define functional and non-functional requirements (throughput, latency targets, availability, data durability)",
      "Draw an architectural block diagram showing clients, API gateway, services, database, cache, and message queue",
      "Trace read and write data flows through the system, calculating expected QPS and storage growth per year",
      "Identify single points of failure (SPOF) and performance bottlenecks under 10x traffic spike",
      "Justify architectural trade-offs: SQL vs NoSQL, Synchronous REST vs Asynchronous Queues, Strong vs Eventual Consistency"
    ],
    "expectedResult": "A comprehensive, professional System Architecture Document suitable for engineering review.",
    "stretch": "Calculate capacity estimates (memory, bandwidth, storage) for 10 million daily active users.",
    "completionCheck": "You can design system architectures, trace data flow, analyze bottlenecks, and justify scaling trade-offs."
  },
  "cloud-fundamentals": {
    "title": "Cloud Infrastructure & IAM Primitives Lab",
    "goal": "Map application requirements to cloud compute, managed database, IAM permissions, and storage",
    "steps": [
      "Map application stack to core cloud primitives: Compute (VM/Container), Storage (S3/Blob), Database (Managed Postgres), Network (VPC/Security Groups)",
      "Configure least-privilege IAM roles and access policies ensuring services only access necessary resources",
      "Store application assets/artifacts in object storage with signed URLs for secure access",
      "Configure structured cloud logging to aggregate application and system logs",
      "Calculate monthly cloud billing estimates and set up budget threshold alerts"
    ],
    "expectedResult": "A clear cloud architecture with secure IAM boundaries, managed database, and budget alerts.",
    "stretch": "Write an Infrastructure-as-Code (Terraform or CloudFormation) snippet defining a storage bucket and IAM role.",
    "completionCheck": "You can configure and reason about cloud compute, managed storage, IAM permissions, networking, and costs."
  },
  "backend-db-depth": {
    "title": "Advanced Database Transactions & Migration Lab",
    "goal": "Implement database transactions with isolation levels, connection pooling, and zero-downtime migrations",
    "steps": [
      "Implement ACID transaction blocks with appropriate isolation levels (Read Committed vs Serializable)",
      "Configure connection pooling (e.g. asyncpg, SQLAlchemy pool, or PgBouncer) and benchmark under 100 concurrent connections",
      "Write database migration scripts using Alembic or raw SQL with forward (upgrade) and backward (downgrade) steps",
      "Simulate a migration on a live database ensuring no table locks block read/write traffic",
      "Diagnose and resolve a simulated database deadlock between two concurrent transactions"
    ],
    "expectedResult": "Safe database operations with connection pooling, robust transactions, and reversible migrations.",
    "stretch": "Implement soft deletes with filtered unique indexes for data retention compliance.",
    "completionCheck": "You can implement transactions with isolation levels, connection pooling, and safe database migrations."
  },
  "observability-reliability": {
    "title": "SRE Service Level Objectives & Alerting Lab",
    "goal": "Define Service Level Indicators (SLIs), Service Level Objectives (SLOs), and actionable alerting rules",
    "steps": [
      "Define 3 core SLIs for your service: Availability (% 2xx/3xx), Latency (P95 < 200ms), Error Rate (% 5xx < 0.1%)",
      "Establish reasonable 30-day SLO targets and calculate the Error Budget",
      "Configure structured application logging with trace IDs and context parameters",
      "Set up multi-window alert rules that trigger only when error budget consumption rate indicates real incident",
      "Write an Incident Post-Mortem template documenting timeline, root cause, impact, and preventive actions"
    ],
    "expectedResult": "Actionable monitoring that alerts on real user impact while avoiding alert fatigue.",
    "stretch": "Implement distributed tracing spans across database queries and external HTTP calls.",
    "completionCheck": "You can define SLIs/SLOs, configure error-budget alerting, and structure incident post-mortems."
  },
  "software-security": {
    "title": "OWASP Security Audit & Threat Model Lab",
    "goal": "Perform an OWASP Top 10 security audit, threat-model application surfaces, and patch vulnerabilities",
    "steps": [
      "Conduct a STRIDE threat model across user authentication, API endpoints, and database queries",
      "Audit code for SQL injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF)",
      "Implement password hashing using Argon2 or bcrypt with secure salt work factors",
      "Enforce strict CORS policies and security headers (Content-Security-Policy, HSTS, X-Content-Type-Options)",
      "Run an automated dependency vulnerability scanner (e.g. pip-audit, npm audit) and patch outdated packages"
    ],
    "expectedResult": "A documented security audit and hardened codebase with zero known high/critical vulnerabilities.",
    "stretch": "Implement rate limiting and brute-force protection on authentication endpoints.",
    "completionCheck": "You can threat-model applications, audit for OWASP vulnerabilities, and implement security controls."
  },
  "performance-concurrency": {
    "title": "Profiling & Async Concurrency Lab",
    "goal": "Profile CPU/memory bottlenecks and implement asynchronous background worker tasks",
    "steps": [
      "Profile application execution using cProfile or py-spy to identify CPU hotspots and slow functions",
      "Profile memory allocation using memory_profiler or tracemalloc to detect memory leaks and large objects",
      "Refactor synchronous blocking I/O calls into async/await coroutines using asyncio",
      "Implement a background task queue (e.g. Celery, ARQ, or FastAPI BackgroundTasks) for long-running jobs",
      "Measure throughput (requests/sec) before and after async concurrency under load"
    ],
    "expectedResult": "Measurable 3x+ throughput improvement and elimination of blocking I/O bottlenecks.",
    "stretch": "Implement concurrency control with asyncio.Semaphore to prevent overwhelming downstream services.",
    "completionCheck": "You can profile CPU/memory bottlenecks, eliminate blocking I/O, and implement async concurrency."
  },
  "operational-maturity": {
    "title": "Incident Response & Post-Mortem Lab",
    "goal": "Conduct a simulated production incident response, mitigation, and blameless post-mortem writeup",
    "steps": [
      "Simulate a production incident (e.g. service outage, memory leak crash, or data corruption bug)",
      "Execute incident triage: detect issue via logs/metrics, identify blast radius, and apply mitigation (rollback/restart)",
      "Perform root cause analysis (5 Whys technique) to find systemic underlying causes",
      "Write a Blameless Post-Mortem document: Incident Summary, Timeline, Impact, Root Cause, What Went Well, Action Items",
      "Convert action items into trackable GitHub issues (preventive checks, automated tests, improved alerts)"
    ],
    "expectedResult": "A complete, professional Post-Mortem writeup and implementation of preventive safeguards.",
    "stretch": "Implement an automated regression test that reproduces the incident failure to prevent recurrence.",
    "completionCheck": "You can lead incident triage, write blameless post-mortems, and implement lasting preventive controls."
  }
};

  const node = (id, name, evidenceStatus, weight, summary, config = {}) => {
    const lab = labs[id] || config.handsOnLab || null;
    const completionCheck = config.completionCheck || lab?.completionCheck || config.proof || 'You can demonstrate this capability independently in a real project.';
    const explainIt = config.explainIt || (lab ? `Explain the core concepts, failure modes, and architectural trade-offs of ${name} to another engineer without reading code verbatim.` : `Explain the mechanics and practical trade-offs of ${name}.`);
    return {
      id, name, evidenceStatus, weight, summary,
      defaultProgress: config.defaultProgress || (
        evidenceStatus === STATUS.PROVEN ? 'completed' :
        [STATUS.LIKELY, STATUS.PARTIAL].includes(evidenceStatus) ? 'in-progress' : 'not-started'
      ),
      whatIsThis: config.whatIsThis || capabilityGuidance[id]?.[0] || summary,
      why: config.why || capabilityGuidance[id]?.[1] || summary,
      teaches: config.teaches || (config.cover?.length ? config.cover : [capabilityGuidance[id]?.[0] || summary]),
      whyNow: config.whyNow || taskExecutionGuidance[id]?.whyNow || `This capability strengthens the foundation required before dependent concepts can be trusted.`,
      careerConnection: config.careerConnection || taskExecutionGuidance[id]?.careerConnection || `Demonstrates ${name} competence in an inspectable project.`,
      miniExercise: config.miniExercise || taskExecutionGuidance[id]?.miniExercise || '',
      projectApplication: config.projectApplication || taskExecutionGuidance[id]?.projectApplication || '',
      unlocks: config.unlocks || taskExecutionGuidance[id]?.unlocks || `Unlocks advanced capability and role readiness in ${name}.`,
      prerequisites: config.prerequisites || [],
      cover: config.cover || [],
      skip: config.skip || [],
      proof: config.proof || '',
      completionCheck,
      explainIt,
      handsOnLab: lab,
      ready: config.ready || '',
      resourceIds: config.resourceIds || [],
      evidenceBasis: config.evidenceBasis || []
    };
  };

  const resourceGuidance = undefined;

  const resources = [
  {
    "id": "R1",
    "name": "MIT Missing Semester 2026",
    "creator": "MIT",
    "platform": "Missing Semester",
    "url": "https://missing.csail.mit.edu/2026/",
    "cost": "Free",
    "length": "9 lectures · selected",
    "stage": "swe-core",
    "relevantSections": "Shell and command-line environment (L1–L2), development environment and tools (L3), debugging and profiling (L4), version control and Git (L5), packaging and shipping code (L6), agentic coding (L7), code quality (L9).",
    "skipSections": "Skim anything already proven. Agentic Coding (L7) is informational; do not treat it as a SWE Core prerequisite.",
    "lastVerified": "26 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Developer tooling and professional workflow",
    "summary": "MIT Missing Semester 2026 teaches the everyday tools that programming courses often leave unexplained: the shell, command-line environment, development tooling, debugging, profiling, version control, packaging, agentic coding, and code quality.",
    "why": "ATLAS uses it in Software Engineering Core because stronger tooling makes existing programming ability faster, safer and easier to inspect.",
    "teaches": "Shell navigation and scripting, command-line environment, development environment and tools, debugging and profiling, Git, packaging and shipping, code quality.",
    "howToUse": "Use capability-specific lectures as primary learning (see node-level selections), then apply each technique to the Project 1 repository. Skim anything already proven.",
    "doneWhen": "You can use the shell and Git confidently, document a systematic debugging session and improve the way a real project is checked or shipped.",
    "prerequisites": []
  },
  {
    "id": "R2",
    "name": "MDN Overview of HTTP",
    "creator": "MDN",
    "platform": "Web documentation",
    "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview",
    "cost": "Free",
    "length": "2–4h selected",
    "stage": "swe-core",
    "relevantSections": "Request/response, methods, codes, headers, caching, cookies, TLS, proxies, CORS and REST semantics.",
    "skipSections": "Do not turn this into a networking degree.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "HTTP and API reasoning",
    "summary": "MDN’s HTTP overview explains the request-and-response protocol underneath browsers, APIs and web services.",
    "why": "It appears after real web/API experience so familiar framework actions can be connected to methods, status codes, headers, caching and failures.",
    "teaches": "How clients, servers and proxies exchange requests and responses; how HTTP controls caching, sessions, authentication and API behavior.",
    "howToUse": "Read the overview and follow linked reference pages only when a project or diagnostic exposes a specific HTTP gap.",
    "doneWhen": "You can trace one real request from client to server and explain its method, headers, status, caching or authentication behavior and likely failure points.",
    "prerequisites": []
  },
  {
    "id": "R3",
    "name": "PostgreSQL Documentation",
    "creator": "PostgreSQL Global Development Group",
    "platform": "Official documentation",
    "url": "https://www.postgresql.org/docs/current/tutorial.html",
    "cost": "Free",
    "length": "8–12h selected",
    "stage": "swe-core",
    "relevantSections": "Schema design, joins, constraints, transactions, isolation intuition, indexes, EXPLAIN, windows and migrations.",
    "skipSections": "Server internals, advanced replication and extension development.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "Relational database engineering",
    "summary": "The PostgreSQL tutorial and documentation explain how a relational database stores related data and enforces rules around it.",
    "why": "Existing SQLite, Postgres and Supabase work makes this targeted depth work—not a first database course.",
    "teaches": "Schema design, joins, constraints, transactions, indexes, query plans, windows and migration reasoning.",
    "howToUse": "Study the selected topics while improving a real backend. Treat the wider manual as reference documentation, not a book to finish.",
    "doneWhen": "You can design relational tables, use joins, constraints and transactions, inspect a query plan and justify basic indexing and migration decisions.",
    "prerequisites": []
  },
  {
    "id": "R4",
    "name": "pytest Documentation",
    "creator": "pytest",
    "platform": "Official documentation",
    "url": "https://docs.pytest.org/en/stable/",
    "cost": "Free",
    "length": "5–8h + project",
    "stage": "swe-core",
    "relevantSections": "Unit, integration and regression tests; fixtures, failure cases and deterministic tests.",
    "skipSections": "Optimizing for 100% coverage.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R5",
    "type": "PRIMARY LEARNING",
    "purpose": "Automated testing with Python",
    "summary": "pytest is a Python testing tool that runs small checks against code and clearly reports what failed.",
    "why": "Testing is the clearest current Software Engineering Core gap and is required before CI can protect the Project 1 repository.",
    "teaches": "Unit, integration and regression tests; fixtures and test setup; expected failures; deterministic test suites.",
    "howToUse": "Learn the core pytest workflow, then write tests around real Project 1 behavior. Return to the documentation when a test design problem appears.",
    "doneWhen": "You can write useful unit and integration tests, test failure cases and run the suite automatically so meaningful regressions are caught.",
    "prerequisites": []
  },
  {
    "id": "R5",
    "name": "FastAPI Testing",
    "creator": "FastAPI",
    "platform": "Official documentation",
    "url": "https://fastapi.tiangolo.com/tutorial/testing/",
    "cost": "Free",
    "length": "1–2h selected",
    "stage": "swe-core",
    "relevantSections": "API test patterns and test-client workflows.",
    "skipSections": "Use only when the project uses FastAPI.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R4",
    "type": "REFERENCE / TARGETED LEARNING",
    "purpose": "Testing FastAPI endpoints",
    "summary": "FastAPI’s testing guide shows how to call API routes in tests without manually running a browser or external client.",
    "why": "Use it when a selected backend uses FastAPI and route behavior must be protected alongside lower-level Python tests.",
    "teaches": "Test-client setup, request/response assertions and API test patterns that integrate with pytest.",
    "howToUse": "Read only while testing a FastAPI service. Pair it with pytest rather than treating it as a separate course.",
    "doneWhen": "You can test successful requests, validation errors, authorization or dependency failures and important database-backed API behavior.",
    "prerequisites": []
  },
  {
    "id": "R6",
    "name": "Docker Get Started",
    "creator": "Docker",
    "platform": "Official documentation",
    "url": "https://docs.docker.com/get-started/",
    "cost": "Free",
    "length": "5–8h + project",
    "stage": "swe-core",
    "relevantSections": "Images, containers, layers, volumes, networks, Compose, multi-stage builds and health checks.",
    "skipSections": "Kubernetes, Swarm and advanced orchestration.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Reproducible application packaging",
    "summary": "Docker packages an application and its runtime environment into images that start as isolated containers.",
    "why": "It is the next dependency after backend and command-line fundamentals because projects must run consistently beyond one laptop.",
    "teaches": "Images, containers, layers, ports, volumes, networks, Compose, multi-stage builds, health checks and basic debugging.",
    "howToUse": "Follow Get Started, then containerize the actual Project 1 or Project 3 services. Learn each concept through the running application.",
    "doneWhen": "You can containerize an application, configure it with environment variables, expose its port and debug basic container, volume or network failures.",
    "prerequisites": []
  },
  {
    "id": "R7",
    "name": "GitHub Actions Documentation",
    "creator": "GitHub",
    "platform": "Official documentation",
    "url": "https://docs.github.com/en/actions",
    "cost": "Free",
    "length": "3–6h + project",
    "stage": "swe-core",
    "relevantSections": "PR checks for format, lint, type checking, tests, builds and deployment.",
    "skipSections": "Complex pipelines before the project needs them.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "REFERENCE / TARGETED LEARNING",
    "purpose": "Automated code and release checks",
    "summary": "GitHub Actions runs workflows on repository events such as pushes and pull requests.",
    "why": "After tests exist, CI turns them into a consistent gate that does not depend on someone remembering to run commands locally.",
    "teaches": "Workflow files, jobs and steps, test/build checks, secrets, artifacts and the basic path toward automated deployment.",
    "howToUse": "Start with one small pull-request workflow for the real repository. Consult the documentation as new checks or deployment needs appear.",
    "doneWhen": "A pull request automatically runs meaningful checks, shows a real failure and success history and is understandable to another contributor.",
    "prerequisites": []
  },
  {
    "id": "R8",
    "name": "Operating Systems: Three Easy Pieces",
    "creator": "Remzi & Andrea Arpaci-Dusseau",
    "platform": "Free textbook",
    "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/",
    "cost": "Free",
    "length": "12–20h selected",
    "stage": "swe-depth",
    "relevantSections": "Processes, virtual memory, threads, locks, files, I/O and basic scheduling.",
    "skipSections": "Most low-level implementation exercises initially.",
    "lastVerified": "13 Aug 2026",
    "status": "still-good",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "Operating-system and concurrency foundations",
    "summary": "OSTEP is a free operating-systems textbook about how programs share processors, memory, storage and devices.",
    "why": "Processes, memory, threads, locks and files explain behavior that surfaces in servers, containers, performance problems and concurrent code.",
    "teaches": "Core intuition for processes, scheduling, virtual memory, concurrency, persistence, files and I/O.",
    "howToUse": "Read only the chapters ATLAS selects and connect them to real debugging or concurrency questions. This is not a 700-page mandatory assignment.",
    "doneWhen": "You can explain how a process uses CPU and memory, why threads can race, how locks help and how files or I/O affect a real application.",
    "prerequisites": []
  },
  {
    "id": "R9",
    "name": "OWASP Top 10:2025",
    "creator": "OWASP",
    "platform": "Security reference",
    "url": "https://owasp.org/Top10/2025/",
    "cost": "Free",
    "length": "4–6h + project",
    "stage": "swe-depth",
    "relevantSections": "Access control, authentication, injection, misconfiguration, secrets, dependencies, validation and security logging.",
    "skipSections": "Pure memorization without applying it.",
    "lastVerified": "26 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "REFERENCE",
    "purpose": "Application-security risk checklist",
    "summary": "The OWASP Top 10:2025 summarizes common classes of web-application security failures.",
    "why": "A real backend must protect access, inputs, secrets and dependencies; security cannot be added only after deployment.",
    "teaches": "Access-control failures, authentication risks, injection, insecure configuration, vulnerable dependencies, validation and security logging.",
    "howToUse": "Use the list to threat-model and test one real application. Follow deeper references only for risks that apply to that architecture.",
    "doneWhen": "You can identify credible threats in one project, implement and test controls and explain the remaining risk rather than merely name the Top 10.",
    "prerequisites": []
  },
  {
    "id": "R10",
    "name": "Google SRE Books",
    "creator": "Google",
    "platform": "Free books",
    "url": "https://sre.google/books/",
    "cost": "Free",
    "length": "10–15h selected",
    "stage": "swe-depth",
    "relevantSections": "SLIs/SLOs, monitoring, alerting, release engineering, troubleshooting and reliability testing.",
    "skipSections": "Reading every chapter before progressing.",
    "lastVerified": "13 Aug 2026",
    "status": "still-good",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "Keeping deployed software reliable",
    "summary": "Google’s SRE books explain Site Reliability Engineering: using software and operational practices to keep services dependable.",
    "why": "Once software is deployed, engineers need measurable reliability targets, monitoring, safe releases and a disciplined response to failures.",
    "teaches": "Service indicators and objectives, monitoring, alerting, troubleshooting, release engineering, reliability tests and incident learning.",
    "howToUse": "Read selected chapters when deployment and observability become real. Do not read every book or chapter before progressing.",
    "doneWhen": "You can define useful health indicators for a project, create actionable monitoring and explain how a release or incident would be detected, handled and learned from.",
    "prerequisites": []
  },
  {
    "id": "R11",
    "name": "LeetCode 75",
    "creator": "LeetCode",
    "platform": "Practice plan",
    "url": "https://leetcode.com/studyplan/leetcode-75/",
    "cost": "Free tier",
    "length": "Pace-dependent",
    "stage": "experience",
    "relevantSections": "Interview patterns across arrays, lists, trees, graphs, heaps and basic DP.",
    "skipSections": "Daily quotas and competitive-programming grind.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRACTICE / GAP FILLER",
    "purpose": "Interview-pattern practice",
    "summary": "LeetCode 75 is a curated set of coding problems covering common data-structure and algorithm patterns.",
    "why": "Existing foundations likely need targeted interview practice and verification, not another full algorithms curriculum.",
    "teaches": "Recognizing common array, list, tree, graph, heap and dynamic-programming patterns and explaining complexity and edge cases.",
    "howToUse": "Run a diagnostic, practise weak patterns and stop quota-driven grinding. Prefer clear reasoning and tests over streaks.",
    "doneWhen": "You can solve and explain representative unseen problems, test edge cases and discuss time and memory trade-offs.",
    "prerequisites": []
  },
  {
    "id": "R12",
    "name": "Essence of Linear Algebra",
    "creator": "3Blue1Brown",
    "platform": "Video series",
    "url": "https://www.3blue1brown.com/?topic=linear-algebra",
    "cost": "Free",
    "length": "3–5h + practice",
    "stage": "math-data",
    "relevantSections": "Vectors, matrices, transformations, dot products, bases, eigen intuition and later SVD/PCA.",
    "skipSections": "Proof-heavy abstract linear algebra unless later required.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Visual linear-algebra intuition",
    "summary": "3Blue1Brown’s Essence of Linear Algebra uses visual explanations to show what vectors, matrices and transformations mean.",
    "why": "ML data, embeddings and neural-network operations become easier to reason about once matrix operations have geometric meaning.",
    "teaches": "Vectors, transformations, matrix multiplication, span, basis, dot products, eigenvectors and links to dimensionality reduction.",
    "howToUse": "Watch the selected sequence and pause to solve or code small examples. Add formal exercises only where the visual intuition is insufficient.",
    "doneWhen": "You can explain datasets and embeddings as vectors, matrix transformations and dot-product or cosine similarity in a real ML context.",
    "prerequisites": []
  },
  {
    "id": "R13",
    "name": "StatQuest",
    "creator": "Josh Starmer",
    "platform": "Video index",
    "url": "https://statquest.org/video_index.html",
    "cost": "Free",
    "length": "8–15h selected",
    "stage": "math-data",
    "relevantSections": "Probability, distributions, sampling, confidence, testing, likelihood and model intuition.",
    "skipSections": "Unrelated playlists.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R14",
    "type": "PRIMARY LEARNING",
    "purpose": "Statistics and model intuition",
    "summary": "StatQuest is a video library that explains statistics and ML ideas step by step with simple diagrams and examples.",
    "why": "It supplies the probability and statistics reasoning needed to choose evaluations and interpret uncertainty in Project 2.",
    "teaches": "Distributions, sampling, likelihood, confidence, hypothesis testing, regression, classification and model-evaluation intuition.",
    "howToUse": "Follow only the topics ATLAS identifies, using the video index as navigation rather than a playlist to complete.",
    "doneWhen": "You can apply the selected concepts correctly to sampling, uncertainty, metrics and error analysis in the ML project.",
    "prerequisites": []
  },
  {
    "id": "R14",
    "name": "Khan Academy Statistics & Probability",
    "creator": "Khan Academy",
    "platform": "Interactive course",
    "url": "https://www.khanacademy.org/math/statistics-probability",
    "cost": "Free",
    "length": "As needed",
    "stage": "math-data",
    "relevantSections": "Targeted exercises for diagnostic gaps.",
    "skipSections": "Repeating mastered modules.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R13",
    "type": "PRACTICE / GAP FILLER",
    "purpose": "Targeted statistics exercises",
    "summary": "Khan Academy provides explanations and interactive exercises for statistics and probability.",
    "why": "It is paired with StatQuest only when a diagnostic shows that understanding is not yet stable through practice.",
    "teaches": "Practice with probability, distributions, sampling, confidence and statistical tests.",
    "howToUse": "Jump directly to weak topics, complete enough exercises to remove the gap and skip modules already demonstrated.",
    "doneWhen": "You can solve representative problems for the identified gap and then use the idea correctly in Project 2.",
    "prerequisites": []
  },
  {
    "id": "R15",
    "name": "Essence of Calculus",
    "creator": "3Blue1Brown",
    "platform": "Video series",
    "url": "https://www.3blue1brown.com/?topic=calculus",
    "cost": "Free",
    "length": "3–5h selected",
    "stage": "math-data",
    "relevantSections": "Derivatives, chain rule and optimization intuition.",
    "skipSections": "Advanced integration and proof-heavy calculus.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R16",
    "type": "PRIMARY LEARNING",
    "purpose": "Calculus intuition for optimization",
    "summary": "3Blue1Brown’s Essence of Calculus visually explains derivatives, change and the chain rule.",
    "why": "These ideas become necessary before deep learning because gradient-based training depends on how outputs change with parameters.",
    "teaches": "Derivatives, local change, the chain rule and the intuition behind gradients and optimization.",
    "howToUse": "Study the selected visual sequence and connect each concept to simple gradient or training examples.",
    "doneWhen": "You can explain how derivatives and the chain rule support gradient descent and reason about basic training behavior.",
    "prerequisites": []
  },
  {
    "id": "R16",
    "name": "Khan Multivariable Calculus",
    "creator": "Khan Academy",
    "platform": "Interactive course",
    "url": "https://www.khanacademy.org/math/multivariable-calculus",
    "cost": "Free",
    "length": "3–6h selected",
    "stage": "math-data",
    "relevantSections": "Partial derivatives and gradients only.",
    "skipSections": "Green, Stokes and divergence theorems.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R15",
    "type": "SELECTED DEPTH READING",
    "purpose": "Partial derivatives and gradients",
    "summary": "Khan Academy’s multivariable calculus material extends derivatives to functions with several inputs.",
    "why": "Neural networks have many parameters, so gradients require partial-derivative intuition beyond single-variable calculus.",
    "teaches": "Partial derivatives, gradient vectors and how a function changes along different parameter directions.",
    "howToUse": "Use only the partial-derivative and gradient sections after the calculus foundation. Skip the broader theorem-heavy course.",
    "doneWhen": "You can calculate or interpret simple partial derivatives and explain what a gradient tells an optimizer.",
    "prerequisites": []
  },
  {
    "id": "R17",
    "name": "Machine Learning Crash Course",
    "creator": "Google for Developers",
    "platform": "Interactive course",
    "url": "https://developers.google.com/machine-learning/crash-course/",
    "cost": "Free",
    "length": "15–25h selected",
    "stage": "classical-ml",
    "relevantSections": "Regression, classification, metrics, data preparation, generalization, overfitting and leakage.",
    "skipSections": "Deep LLM modules until their dependency stage.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R18",
    "type": "PRIMARY LEARNING",
    "purpose": "Classical ML and data-quality foundations",
    "summary": "Google’s Machine Learning Crash Course is a concise, interactive introduction to building and evaluating classical ML models.",
    "why": "It establishes the complete problem, data, model and evaluation loop before MLOps or deep learning.",
    "teaches": "Regression, classification, metrics, generalization, overfitting, data preparation, feature quality, leakage and responsible evaluation.",
    "howToUse": "Complete the selected classical-ML and data modules, then apply them immediately to Project 2 instead of treating exercises as final proof.",
    "doneWhen": "You can frame a problem, prepare and split data without leakage, build a baseline and justify metrics and model conclusions.",
    "prerequisites": []
  },
  {
    "id": "R18",
    "name": "Machine Learning Zoomcamp",
    "creator": "DataTalksClub",
    "platform": "GitHub course",
    "url": "https://github.com/DataTalksClub/machine-learning-zoomcamp",
    "cost": "Free",
    "length": "Substantial, self-paced",
    "stage": "classical-ml",
    "relevantSections": "Selected regression, classification, evaluation, tree models and deployment sections.",
    "skipSections": "Leaderboards, cohort deadlines and certificate mechanics.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R17",
    "type": "PRIMARY LEARNING",
    "purpose": "Project-shaped classical ML practice",
    "summary": "Machine Learning Zoomcamp is a free practical course that builds classical models and moves selected work toward deployment.",
    "why": "It complements concise concepts with an end-to-end workflow that can be adapted to the domain-flexible Project 2.",
    "teaches": "Data preparation, regression, classification, trees, evaluation, feature work, model comparison and selected deployment patterns.",
    "howToUse": "Use the self-paced selected modules as project support. Do not duplicate every R17 topic or follow cohort, leaderboard and certificate mechanics.",
    "doneWhen": "Project 2 has a reproducible dataset pipeline, justified baseline and models, correct evaluation, leakage checks and honest error analysis.",
    "prerequisites": []
  },
  {
    "id": "R19",
    "name": "scikit-learn User Guide",
    "creator": "scikit-learn",
    "platform": "Official documentation",
    "url": "https://scikit-learn.org/stable/user_guide.html",
    "cost": "Free",
    "length": "Reference",
    "stage": "classical-ml",
    "relevantSections": "Consult by problem while building the complete ML workflow.",
    "skipSections": "Trying to complete the entire library.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "REFERENCE",
    "purpose": "scikit-learn implementation guidance",
    "summary": "The scikit-learn User Guide documents the Python library used for many classical ML models, preprocessing and evaluation tools.",
    "why": "It helps implement a reasoned workflow after concepts are understood; the library itself is too large to study from beginning to end.",
    "teaches": "How specific estimators, pipelines, preprocessing steps, metrics and model-selection utilities behave and should be used.",
    "howToUse": "Consult it by problem while building Project 2. Read the conceptual notes and warnings for the exact API being used.",
    "doneWhen": "You can choose and use the relevant scikit-learn components correctly and explain the pipeline without relying on copied boilerplate.",
    "prerequisites": []
  },
  {
    "id": "R20",
    "name": "MLOps Zoomcamp",
    "creator": "DataTalksClub",
    "platform": "GitHub course",
    "url": "https://github.com/DataTalksClub/mlops-zoomcamp",
    "cost": "Free",
    "length": "Substantial, self-paced",
    "stage": "ml-engineering",
    "relevantSections": "Tracking, reproducibility, pipelines, deployment, testing, CI/CD and monitoring.",
    "skipSections": "Mandatory Kubernetes, Terraform, Kafka or every orchestration platform.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Production ML engineering",
    "summary": "MLOps Zoomcamp teaches how to turn model experiments into reproducible, deployable and observable ML services.",
    "why": "Training a model is only one part of ML engineering; Project 3 must package, test, deploy, monitor and safely update Project 2.",
    "teaches": "Experiment tracking, artifacts, pipelines, model serving, deployment, testing, CI/CD and monitoring.",
    "howToUse": "Use the self-paced selected modules while productionizing Project 2. Skip optional infrastructure whose complexity the project does not justify.",
    "doneWhen": "You can reproduce training, version the model, serve it through a tested interface, deploy it and observe its health and update path.",
    "prerequisites": []
  },
  {
    "id": "R21",
    "name": "Neural Networks: Zero to Hero",
    "creator": "Andrej Karpathy",
    "platform": "Video course",
    "url": "https://karpathy.ai/zero-to-hero.html",
    "cost": "Free",
    "length": "15h+",
    "stage": "deep-learning",
    "relevantSections": "micrograd, backpropagation, makemore, training dynamics and language-model mechanics.",
    "skipSections": "Certificate thinking.",
    "lastVerified": "13 Aug 2026",
    "status": "still-good",
    "alternativeId": "R22",
    "type": "PRIMARY LEARNING",
    "purpose": "Neural-network mechanics and intuition",
    "summary": "Karpathy’s Zero to Hero builds neural networks from small components so backpropagation and training behavior are visible.",
    "why": "It supplies the “why” behind neural networks before PyTorch abstractions are used for Project 4.",
    "teaches": "Backpropagation, tensors, losses, training loops, learning rates, activations, gradients, normalization and language-model mechanics.",
    "howToUse": "Code along with the selected sequence and change examples to test understanding. The goal is training intuition, not video completion.",
    "doneWhen": "You can explain forward and backward passes, implement core mechanics and diagnose a small network that is not training well.",
    "prerequisites": [
      "Math + classical ML fundamentals"
    ]
  },
  {
    "id": "R22",
    "name": "PyTorch Learn the Basics",
    "creator": "PyTorch",
    "platform": "Official tutorials",
    "url": "https://docs.pytorch.org/tutorials/beginner/basics/intro.html",
    "cost": "Free",
    "length": "4–8h + project",
    "stage": "deep-learning",
    "relevantSections": "Tensors, datasets/loaders, modules, autograd, optimizers, evaluation, checkpoints and debugging.",
    "skipSections": "High-level inference alone as proof.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": "R21",
    "type": "PRIMARY LEARNING",
    "purpose": "Hands-on PyTorch engineering",
    "summary": "PyTorch Learn the Basics teaches the main library pieces for preparing data, defining neural models and training them.",
    "why": "It complements Zero to Hero by showing the official framework structure required for genuine Project 4 evidence.",
    "teaches": "Tensors, datasets and loaders, modules, autograd, optimizers, training/evaluation loops, checkpoints and reproducibility.",
    "howToUse": "Complete the Basics path and transfer it to the real Project 4 problem. Use other PyTorch documentation only as that project requires.",
    "doneWhen": "You can construct, train, evaluate and debug a real neural model in PyTorch rather than only call a pretrained API.",
    "prerequisites": [
      "Math + classical ML fundamentals"
    ]
  },
  {
    "id": "R23",
    "name": "Hugging Face LLM Course",
    "creator": "Hugging Face",
    "platform": "Interactive course",
    "url": "https://huggingface.co/learn/llm-course/en/chapter1/1",
    "cost": "Free",
    "length": "20h selected",
    "stage": "llm-fundamentals",
    "relevantSections": "Transformers, tokenizers, datasets, inference, chat templates, SFT, LoRA and evaluation.",
    "skipSections": "Historic NLP tasks that do not support a project; extensive fine-tuning without a reason.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Transformer and LLM foundations",
    "summary": "The Hugging Face LLM Course explains how transformer models, tokenizers, datasets, inference and adaptation work in practice.",
    "why": "Local model use is already proven; this resource fills the missing understanding behind model behavior and trade-offs.",
    "teaches": "Transformers, tokenization, model loading, datasets, chat templates, inference, supervised fine-tuning, LoRA and evaluation.",
    "howToUse": "Follow selected modern LLM chapters and build a model-aware artifact. Skip historic tasks and extensive fine-tuning that do not support the project.",
    "doneWhen": "You can explain the model and token flow, make reasoned inference or adaptation choices and evaluate them on representative examples.",
    "prerequisites": []
  },
  {
    "id": "R24",
    "name": "LLM Zoomcamp",
    "creator": "DataTalksClub",
    "platform": "GitHub course",
    "url": "https://github.com/DataTalksClub/llm-zoomcamp",
    "cost": "Free",
    "length": "Substantial, self-paced",
    "stage": "ai-systems",
    "relevantSections": "Retrieval, vector search, RAG, evaluation, monitoring, reranking and end-to-end LLM applications.",
    "skipSections": "Certificate and cohort scheduling.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Evaluated LLM and retrieval systems",
    "summary": "LLM Zoomcamp is a practical course on building retrieval-augmented LLM applications and measuring their behavior.",
    "why": "It moves ATLAS from model usage to end-to-end AI systems with retrieval, evaluation, monitoring and regression protection.",
    "teaches": "Search and vector retrieval, RAG, evaluation datasets and metrics, reranking, monitoring, feedback and end-to-end system design.",
    "howToUse": "Use selected self-paced modules while building an actual evaluated system. Ignore cohort deadlines and certificate mechanics.",
    "doneWhen": "You can compare retrieval baselines, evaluate answers, trace failures and run a regression suite before changing prompts, models or context.",
    "prerequisites": [
      "LLM fundamentals"
    ]
  },
  {
    "id": "R25",
    "name": "Hugging Face Agents Course",
    "creator": "Hugging Face",
    "platform": "Interactive course",
    "url": "https://huggingface.co/learn/agents-course/unit0/introduction",
    "cost": "Free",
    "length": "10–20h selected",
    "stage": "ai-systems",
    "relevantSections": "Fundamentals, agent loop, tool actions, agentic RAG, evaluation and observability.",
    "skipSections": "Mastering every agent framework.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "PRIMARY LEARNING",
    "purpose": "Tool-using agent systems",
    "summary": "The Hugging Face Agents Course explains agents as model-driven loops that select tools, observe results and continue toward a task.",
    "why": "It appears only after LLM fundamentals because an agent adds orchestration and failure modes; it does not replace model, retrieval or evaluation knowledge.",
    "teaches": "Agent loops, messages and actions, tool contracts, agentic RAG, multi-step behavior, evaluation and observability.",
    "howToUse": "Study the framework-independent fundamentals and selected practical units. Implement one measured agent rather than learning every framework.",
    "doneWhen": "You can build an agent with clear tool boundaries and measure task success, trajectories, failures, latency and cost.",
    "prerequisites": [
      "LLM fundamentals"
    ]
  },
  {
    "id": "R26",
    "name": "Hugging Face MCP Course",
    "creator": "Hugging Face",
    "platform": "Interactive course",
    "url": "https://huggingface.co/learn/mcp-course/en/unit0/introduction",
    "cost": "Free",
    "length": "6–12h selected",
    "stage": "ai-systems",
    "relevantSections": "Host/client/server, tools, resources, authorization, useful servers and system integration.",
    "skipSections": "Toy MCP work presented as a flagship project.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "MCP integration and tool interfaces",
    "summary": "The Hugging Face MCP Course explains Model Context Protocol, a standard for connecting AI hosts to tools and data resources.",
    "why": "MCP belongs after agent and systems fundamentals because it is an integration mechanism, not a prerequisite for understanding AI.",
    "teaches": "Hosts, clients, servers, tools, resources, transport, authorization and the design of useful MCP integrations.",
    "howToUse": "Read selected units only when a real project benefits from an MCP boundary. Do not build a toy server merely to claim MCP.",
    "doneWhen": "You can explain the protocol roles and implement or justify a secure, useful MCP interface inside a real system.",
    "prerequisites": [
      "LLM fundamentals"
    ]
  },
  {
    "id": "R27",
    "name": "Hugging Face Context Course",
    "creator": "Hugging Face",
    "platform": "Interactive course",
    "url": "https://huggingface.co/context-course",
    "cost": "Free",
    "length": "Later specialization",
    "stage": "specialization",
    "relevantSections": "Context, skills, plugins, MCP, subagents, hooks and practical agent workflows.",
    "skipSections": "Using it as a substitute for SWE, ML, retrieval or evaluation.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "LATER SPECIALIZATION",
    "purpose": "Context and agent-workflow specialization",
    "summary": "The Hugging Face Context Course studies how agent systems select context, skills, plugins, tools and subagents.",
    "why": "It supports the Project 5 developer-infrastructure hypothesis only after SWE, retrieval and evaluation foundations are strong.",
    "teaches": "Context selection, agent skills, plugins, MCP, subagents, hooks and practical workflow design.",
    "howToUse": "Keep it locked to later specialization work and extract only techniques that Project 5 can benchmark.",
    "doneWhen": "You can demonstrate a measured improvement in task accuracy, context relevance, latency or token efficiency against credible baselines.",
    "prerequisites": []
  },
  {
    "id": "R28",
    "name": "OWASP GenAI LLM Top 10 2026",
    "creator": "OWASP",
    "platform": "Security reference",
    "url": "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/",
    "cost": "Free",
    "length": "4–8h + project",
    "stage": "production-ai",
    "relevantSections": "Prompt Injection (LLM01), Sensitive Information Disclosure (LLM02), Improper Output Handling (LLM05), Excessive Agency (LLM06), Vector & Embedding Weaknesses (LLM08), Unbounded Consumption (LLM10). Also Supply Chain Vulnerabilities (LLM03) and Data & Model Poisoning (LLM04) where relevant to project architecture.",
    "skipSections": "Treating security as a checklist detached from the system.",
    "lastVerified": "26 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "REFERENCE",
    "purpose": "Security for generative-AI systems",
    "summary": "The OWASP GenAI LLM Top 10 2026 documents common risks in LLM and agent applications: Prompt Injection, Sensitive Information Disclosure, Supply Chain Vulnerabilities, Data & Model Poisoning, Improper Output Handling, Excessive Agency, System Prompt Leakage, Vector & Embedding Weaknesses, Misinformation, and Unbounded Consumption.",
    "why": "Retrieval and tool access create new data and action risks that ordinary web-security checklists do not fully describe.",
    "teaches": "Prompt injection, sensitive-data disclosure, insecure output handling, excessive agency, vector/embedding risks, unbounded consumption, and supply-chain and poisoning risks where relevant.",
    "howToUse": "Threat-model the actual Production AI system and consult the relevant 2026 risk pages. Do not apply the list as context-free compliance theater.",
    "doneWhen": "You can identify credible attacks, limit tool and data permissions and test the most important controls and failure paths.",
    "prerequisites": []
  },
  {
    "id": "R29",
    "name": "Stanford CS336: Language Modeling from Scratch",
    "creator": "Stanford",
    "platform": "University course",
    "url": "https://cs336.stanford.edu/",
    "cost": "Free materials",
    "length": "Very substantial",
    "stage": "deep-learning",
    "relevantSections": "Advanced tokenizer/model/optimizer construction, systems optimization, distributed training and evaluation.",
    "skipSections": "Locked until SWE, math, ML, PyTorch and transformer prerequisites are strong.",
    "lastVerified": "13 Aug 2026",
    "status": "locked",
    "alternativeId": null,
    "type": "LOCKED ADVANCED RESOURCE",
    "purpose": "Language-model construction from scratch",
    "summary": "Stanford CS336 is an advanced university course on tokenizers, language models, optimizers, training systems and evaluation.",
    "why": "Its depth becomes useful only after strong software, math, ML, PyTorch and transformer foundations; it is not required for a first Applied AI role.",
    "teaches": "Advanced tokenizer, model and optimizer construction, scaling, systems optimization, distributed training, data and evaluation.",
    "howToUse": "Do not use yet. Reassess only when the listed prerequisites are evidenced and research or infrastructure goals justify the time.",
    "doneWhen": "A later research or infrastructure objective genuinely requires from-scratch language-model depth and you can complete the work without displacing missing foundations.",
    "prerequisites": [
      "Math + classical ML fundamentals"
    ]
  },
  {
    "id": "R30",
    "name": "AWS Cloud Practitioner Essentials / Cloud Essentials",
    "creator": "AWS Training & Certification",
    "platform": "AWS Skill Builder",
    "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/",
    "cost": "Free digital path",
    "length": "Selected fundamentals",
    "stage": "swe-depth",
    "relevantSections": "Durable concepts behind compute, storage, networking, databases, IAM, secrets, monitoring, deployment, scaling and cost.",
    "skipSections": "Exam memorization, hundreds of services and advanced governance.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "Cloud infrastructure fundamentals",
    "summary": "AWS Cloud Essentials introduces the compute, storage, networking, database, identity and monitoring concepts used to run software in the cloud.",
    "why": "It follows Docker and basic deployment so cloud terms are connected to a real service rather than memorized for a certificate.",
    "teaches": "Compute, storage, networking, managed databases, IAM, secrets, monitoring, scaling, regions and basic cost reasoning.",
    "howToUse": "Study durable concepts and map them to one deployment. Ignore exam memorization and the wider AWS service catalogue.",
    "doneWhen": "You can deploy a serious Dockerized service and explain its networking, identity, secrets, monitoring, scaling and cost choices.",
    "prerequisites": []
  },
  {
    "id": "R31",
    "name": "System Design Primer",
    "creator": "Donne Martin",
    "platform": "GitHub",
    "url": "https://github.com/donnemartin/system-design-primer",
    "cost": "Free / open source",
    "length": "Selected fundamentals",
    "stage": "swe-depth",
    "relevantSections": "Requirements, service boundaries, APIs, databases, caching, queues, scaling, availability, consistency and trade-offs.",
    "skipSections": "Senior interview drills, giant diagrams and advanced distributed-system internals.",
    "lastVerified": "13 Aug 2026",
    "status": "still-good",
    "alternativeId": null,
    "type": "SELECTED DEPTH READING",
    "purpose": "Application architecture reasoning",
    "summary": "System Design Primer is a large open-source guide to designing services, data stores, caches, queues and scalable systems.",
    "why": "It appears after backend, HTTP, database and real-project experience so design trade-offs can be grounded in an application you understand.",
    "teaches": "Requirements, service boundaries, APIs, data flow, databases, caching, queues, availability, consistency, failures and scaling.",
    "howToUse": "Read only the selected fundamentals and apply them to a real architecture. Skip senior interview drills and hyperscale design theater.",
    "doneWhen": "You can explain a real application’s components, data flow, bottlenecks, failure points and reasonable architectural improvements.",
    "prerequisites": []
  },
  {
    "id": "R32",
    "name": "FastAPI Official Tutorial",
    "creator": "FastAPI",
    "platform": "Official documentation",
    "url": "https://fastapi.tiangolo.com/tutorial/",
    "cost": "Free",
    "length": "Selected by project need",
    "stage": "swe-core",
    "relevantSections": "Request validation, routing, dependencies, errors, security concepts, SQL/database integration, larger applications, background tasks, testing and deployment concepts.",
    "skipSections": "Do not complete every advanced FastAPI feature merely because it exists.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "REFERENCE / TARGETED LEARNING",
    "purpose": "Backend fundamentals and depth",
    "summary": "FastAPI is a Python framework for building APIs; its official tutorial shows how a backend receives requests, validates data and organizes application logic.",
    "why": "The roadmap already includes Python and backend exposure, so this is selective depth for building a more complete, testable service—not another beginner programming course.",
    "teaches": "Routing, request validation, dependencies, error handling, security concepts, SQL/database integration, larger application structure, background tasks, testing and deployment concepts.",
    "howToUse": "Select the tutorial sections needed by Backend Fundamentals, backend/database depth or Project 1. Build each concept into a real API rather than completing every feature.",
    "doneWhen": "You can build and explain a properly structured API with validation, database access, error handling and automated tests.",
    "prerequisites": []
  },
  {
    "id": "R33",
    "name": "NumPy — Absolute Basics for Beginners",
    "creator": "NumPy",
    "platform": "Official documentation",
    "url": "https://numpy.org/doc/stable/user/absolute_beginners.html",
    "cost": "Free",
    "length": "Diagnostic; 2–4h if needed",
    "stage": "math-data",
    "relevantSections": "Arrays, dimensions/shapes, indexing/slicing, vectorized and basic numerical operations, and reshaping where needed.",
    "skipSections": "Do not make this mandatory when existing evidence already proves sufficient NumPy ability.",
    "lastVerified": "13 Aug 2026",
    "status": "current",
    "alternativeId": null,
    "type": "DIAGNOSTIC / GAP FILLER",
    "purpose": "NumPy and numerical-data foundations",
    "summary": "NumPy is the numerical-array library underneath much of Python’s data-science and ML ecosystem.",
    "why": "Arrays, shapes and numerical operations make pandas, scikit-learn and PyTorch easier to reason about, but existing evidence may already be sufficient.",
    "teaches": "Arrays, dimensions and shapes, indexing and slicing, vectorized operations, basic numerical operations and reshaping.",
    "howToUse": "Take a short diagnostic and read only the sections that close a real gap. Do not make it mandatory when project evidence already proves comfortable NumPy use.",
    "doneWhen": "You can manipulate arrays and understand shapes well enough to work comfortably with ML and data code.",
    "prerequisites": []
  }
];

  const youtubeLearning = [
  {
    "id": "YT1",
    "nodeIds": [
      "testing",
      "basic-ci"
    ],
    "title": "Pytest Tutorial – How to Test Python Code",
    "creator": "freeCodeCamp.org / Rithmic",
    "url": "https://www.youtube.com/watch?v=cHYq1MRoyI0",
    "type": "FULL COURSE",
    "duration": "~1 hr 15 min",
    "level": "Beginner to Intermediate",
    "whySelected": "Practical pytest course covering first tests, fixtures, marking and parametrization, and mocking applied to real application behavior.",
    "whatItTeaches": "Writing unit and failure-case tests, fixture setup/teardown, parameterized tests with pytest.mark.parametrize, and mocking dependencies.",
    "selectedSections": "Focus on: First Tests, Fixtures, Marking and Parametrization, Mocking",
    "skip": "Testing with ChatGPT / AI-assisted section if a skip is needed",
    "doneWhen": "You can write useful unit tests, fixtures, parametrized tests and mocks, then apply them to meaningful application behavior.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT2",
    "nodeIds": [
      "docker",
      "production-deployment"
    ],
    "title": "Docker Tutorial for Beginners [FULL COURSE in 3 Hours]",
    "creator": "TechWorld with Nana",
    "url": "https://www.youtube.com/watch?v=3c-iBn73dDE",
    "type": "FULL COURSE",
    "duration": "~3 hr",
    "level": "Beginner",
    "whySelected": "Visual introduction to Docker concepts, images vs containers, Dockerfiles, networking, volumes, and Docker Compose.",
    "whatItTeaches": "Docker concepts, images vs containers, basic commands, container debugging/logs, ports, Dockerfiles, building images, Docker networking, volumes/persistence, Docker Compose.",
    "selectedSections": "Focus on: Docker concepts, images vs containers, Dockerfiles, ports, volumes, networking, Docker Compose",
    "skip": "Skip cloud/registry/deployment-specific details until the project requires them",
    "doneWhen": "You can containerize a backend application, configure environment variables, and run it with docker compose.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT3",
    "nodeIds": [
      "basic-ci",
      "ml-deployment"
    ],
    "title": "Complete GitHub Actions Course - From BEGINNER to PRO",
    "creator": "DevOps Directive / Sid Palas",
    "url": "https://www.youtube.com/watch?v=Xwpi0ITkL3U",
    "type": "FULL COURSE",
    "duration": "~3 hr 42 min",
    "level": "Beginner to Intermediate",
    "whySelected": "Comprehensive GitHub Actions course covering CI motivation, core platform features, common automation workflows, and best practices for test and build pipelines.",
    "whatItTeaches": "Workflows, jobs, steps, runners, environment secrets, matrix builds, PR triggers, automated testing, Docker image builds, and status checks.",
    "selectedSections": "Focus on: CI motivation, Core Platform Features, Common Automation Workflows, Best Practices, end-to-end test and build workflow",
    "skip": "Custom action authoring, advanced reusable/action-development material, and advanced release automation not required by the current project",
    "doneWhen": "A pull request triggers an automated test and build check that blocks broken merges.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT4",
    "nodeIds": [
      "dsa"
    ],
    "title": "Data Structures and Algorithms Mega Course – Master Technical Interviews in 49 Hours",
    "creator": "freeCodeCamp.org / Destination FAANG",
    "url": "https://www.youtube.com/watch?v=xwI5OBEnsZU",
    "type": "FULL COURSE",
    "duration": "49 hr (Selected Chapters)",
    "level": "Beginner to Intermediate",
    "whySelected": "Comprehensive foundational computer science course teaching data structures and algorithms conceptually before LeetCode grinding. Course implementations use Java; use it for concepts but implement ATLAS practice and interview exercises in Python.",
    "whatItTeaches": "Big O notation, memory layout, arrays, linked lists, stacks/queues, hash maps, binary trees, heaps, graphs, sorting, and recursion.",
    "selectedSections": "Focus on: Big-O / Complexity, Arrays, Strings, Sorting and Searching, Trees, Graphs — optionally Sliding Window and Two Pointers",
    "skip": "Competitive programming tricks, esoteric mathematical proofs, and daily quota-driven grinding",
    "doneWhen": "You understand time/space complexity, can implement core data structures in Python, and reason through interview problems.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT5",
    "nodeIds": [
      "linear-algebra"
    ],
    "title": "Essence of Linear Algebra",
    "creator": "3Blue1Brown",
    "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
    "type": "PLAYLIST / DEEP DIVE",
    "duration": "15 videos (~3.5 hr total)",
    "level": "Beginner to Intermediate",
    "whySelected": "Unrivaled geometric visual intuition for linear transformations, vectors, matrices, dot products, eigenvalues, and basis changes.",
    "whatItTeaches": "Vectors as geometry, linear combinations, span, basis, matrix-vector multiplication, determinants, inverses, dot/cross products, eigenvalues/eigenvectors.",
    "selectedSections": "Focus on vectors as geometry, linear combinations, span, basis, matrix-vector multiplication, determinants, inverses, dot/cross products, eigenvalues and eigenvectors",
    "skip": "Cramer's rule if short on time",
    "doneWhen": "You can visualize matrix transformations and connect vector dot products to cosine similarity in ML.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT6",
    "nodeIds": [
      "calculus-optimization"
    ],
    "title": "Essence of Calculus",
    "creator": "3Blue1Brown",
    "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr",
    "type": "PLAYLIST / DEEP DIVE",
    "duration": "12 videos (~3 hr total)",
    "level": "Beginner",
    "whySelected": "Intuitive geometric grounding in derivatives, the chain rule, and optimization surfaces before deep learning.",
    "whatItTeaches": "Derivatives, local change, chain rule, partial derivatives, gradients, local minima, and optimization intuition.",
    "selectedSections": "Focus on derivative intuition, derivative rules, chain-rule intuition and gradient/partial-derivative intuition relevant to ML",
    "skip": "Taylor series and integration proofs unless interested",
    "doneWhen": "You can explain how gradients guide parameter updates in gradient descent.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT7",
    "nodeIds": [
      "probability-statistics"
    ],
    "title": "Statistics Fundamentals Playlist",
    "creator": "StatQuest with Josh Starmer",
    "url": "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9",
    "type": "PLAYLIST / TARGETED",
    "duration": "Curated Playlist (~4 hr)",
    "level": "Beginner",
    "whySelected": "Bite-sized, jargon-free explanations of core distributions, hypothesis testing, p-values, and statistical estimation.",
    "whatItTeaches": "Normal/Binomial distributions, Central Limit Theorem, p-values, confidence intervals, Bayes theorem, Maximum Likelihood Estimation, variance vs bias.",
    "selectedSections": "Focus on: Distributions (Normal, Binomial, Poisson), p-values and hypothesis testing, Confidence intervals, Bayes theorem, Maximum Likelihood Estimation, Variance vs Bias",
    "skip": "Genetics-specific statistical tests and any StatQuest content not in the Fundamentals playlist",
    "doneWhen": "You can interpret confidence intervals, evaluate variance vs bias, and avoid misleading correlations in ML models.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT8",
    "nodeIds": [
      "relational-db",
      "backend-db-depth"
    ],
    "title": "PostgreSQL Tutorial for Beginners",
    "creator": "freeCodeCamp.org / Amigoscode",
    "url": "https://www.youtube.com/watch?v=qw--VYLpxG4",
    "type": "FULL COURSE",
    "duration": "4 hr 20 min",
    "level": "Beginner to Intermediate",
    "whySelected": "Comprehensive relational database design, SQL querying, constraints, joins, transactions, and indexing in PostgreSQL.",
    "whatItTeaches": "Table design, primary/foreign keys, CRUD, aggregate functions, JOINS, GROUP BY, constraints, transactions, and basic indexing.",
    "selectedSections": "Focus on setup, tables/schema, CRUD, filtering/grouping, constraints, primary/foreign keys, joins and timestamps/UUIDs; skim Mockaroo data generation and GUI-specific details",
    "skip": "GUI tool comparison debates and pgAdmin setup details",
    "doneWhen": "You can write multi-table joins, enforce schema constraints, handle transactions, and inspect basic query plans.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT9",
    "nodeIds": [
      "backend",
      "http-api"
    ],
    "title": "Python API Development - Comprehensive Course for Beginners",
    "creator": "freeCodeCamp.org / Sanjeev Thiyagarajan",
    "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA",
    "type": "FULL COURSE",
    "duration": "19 hr",
    "level": "Beginner to Intermediate",
    "whySelected": "Modern, production-focused Python API development covering routers, Pydantic validation, dependency injection, and CRUD operations.",
    "whatItTeaches": "HTTP methods, route parameters, Pydantic models, status codes, async endpoints, error handling, dependency injection, and API docs.",
    "selectedSections": "Focus on FastAPI basics, requests/responses, validation, routers, dependencies, database integration, errors/status codes, authentication and testing where relevant; skip React/JS frontend integration",
    "skip": "Frontend integration if focusing on backend API contract",
    "doneWhen": "You can build a validated, documented REST API with relational persistence and error handling.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT10",
    "nodeIds": [
      "ml-problem-framing",
      "ml-data-splits",
      "ml-models",
      "ml-evaluation",
      "ml-reproducibility"
    ],
    "title": "Machine Learning with Python and Scikit-Learn – Full Course",
    "creator": "Jovian / freeCodeCamp.org",
    "url": "https://www.youtube.com/watch?v=hDKCxebp88A",
    "type": "FULL COURSE",
    "duration": "~18 hr (Selected Modules)",
    "level": "Beginner to Intermediate",
    "whySelected": "Practical, project-centric classical machine learning workflow: problem framing, data preparation, train/val/test splits, regression/classification, trees, cross-validation, and error analysis.",
    "whatItTeaches": "Linear/logistic regression, decision trees, random forests, gradient boosting, hyperparameter tuning, metrics (Precision, Recall, F1, ROC-AUC), and leakage prevention.",
    "selectedSections": "Focus on Modules 1–4 (Linear Models, Tree Models, Evaluation, Pipelines); skip Kaggle leaderboard sessions",
    "skip": "Kaggle competition leaderboard tricks and overfitting-to-competition tricks",
    "doneWhen": "You can take raw tabular data, prepare it without leakage, train and compare models against a simple baseline, and analyze error slices.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT11",
    "nodeIds": [
      "experiment-tracking",
      "ml-pipelines",
      "model-serving",
      "ml-monitoring",
      "ml-deployment"
    ],
    "title": "MLOps Zoomcamp - Full Practical Course",
    "creator": "DataTalksClub / Alexey Grigorev",
    "url": "https://www.youtube.com/playlist?list=PL3MmuxUbc_hIUISrluw_A7wDSmfOhErQ4",
    "type": "PLAYLIST / FULL COURSE",
    "duration": "6 modules (~12 hr)",
    "level": "Intermediate",
    "whySelected": "Gold standard open-source curriculum for transitioning ML models into deployable, observable services with MLflow, Docker, and monitoring.",
    "whatItTeaches": "Experiment tracking with MLflow, orchestration pipelines with Prefect/Mage, model registries, web service model deployment with Flask/FastAPI, monitoring data drift with Evidently.",
    "selectedSections": "Capability-specific: experiment-tracking → Module 2 (MLflow Tracking); ml-pipelines → Module 3 (Orchestration and Pipelines); model-serving → Module 4 (Deployment); ml-monitoring → Module 5 (Monitoring and Drift Detection); ml-deployment → Modules 4 + 6 (Deployment and Best Practices/Testing)",
    "skip": "Complex multi-cloud setups, Terraform, and Kafka until project architecture requires them",
    "doneWhen": "You can log model experiments, serve predictions via an API, containerize the service, and monitor basic inference latency/drift.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT12",
    "nodeIds": [
      "dl-mechanics",
      "pytorch",
      "dl-debugging"
    ],
    "title": "PyTorch for Deep Learning & Machine Learning – Full Course",
    "creator": "Daniel Bourke / freeCodeCamp.org",
    "url": "https://www.youtube.com/watch?v=V_xro1bcAuA",
    "type": "FULL COURSE",
    "duration": "26 hr (Selected Units)",
    "level": "Beginner to Intermediate",
    "whySelected": "Hands-on, code-first mastery of PyTorch tensors, datasets/DataLoaders, custom nn.Modules, training loops, evaluation, and transfer learning.",
    "whatItTeaches": "Tensors, PyTorch workflow, neural network classification/regression, custom datasets, modular code organization, transfer learning, experiment tracking.",
    "selectedSections": "Capability-specific: dl-mechanics → Modules 00 (Fundamentals), 01 (Workflow), 02 (Classification — forward/backward/loss intuition); pytorch → Modules 00 (Fundamentals), 01 (Workflow), 04 (Custom Datasets and DataLoaders); dl-debugging → relevant parts of Modules 01, 02, and 04 (training loops, loss curves, eval mode)",
    "skip": "Modules 05+ (Transfer Learning, Paper Replication, Model Deployment) unless the project specifically needs them",
    "doneWhen": "You can build, train, evaluate, and debug a custom or adapted PyTorch model on a real dataset.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT13",
    "nodeIds": [
      "dl-mechanics",
      "embeddings-attention",
      "transformers"
    ],
    "title": "Neural Networks: Zero to Hero",
    "creator": "Andrej Karpathy",
    "url": "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
    "type": "PLAYLIST / MASTERCLASS",
    "duration": "7 videos (~16 hr total)",
    "level": "Intermediate",
    "whySelected": "First-principles implementation of autograd (micrograd), backpropagation, language modeling, multi-layer perceptrons, and GPT from scratch in raw Python and PyTorch.",
    "whatItTeaches": "Autograd mechanics, computational graphs, backprop math, n-gram vs MLP models, batch norm, manual backprop, and building nanoGPT from scratch.",
    "selectedSections": "Capability-specific: dl-mechanics → \"The spelled-out intro to neural networks and backpropagation: building micrograd\" + \"Building makemore\" Part 1 (backprop and MLP intuition); embeddings-attention → \"Let's build the GPT Tokenizer\" + \"Let's build GPT: from scratch, in code\" (embeddings, positional encoding, causal masking, multi-head attention); transformers → \"Let's build GPT: from scratch, in code\" (full transformer forward pass and autoregressive generation)",
    "skip": "Intermediate makemore videos (Parts 2–5) are supplementary; skip manual analytical backprop derivations if calculus intuition is already firm",
    "doneWhen": "You understand how tokens flow through multi-head self-attention and how backpropagation updates weights.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT14",
    "nodeIds": [
      "retrieval-rag",
      "context-engineering"
    ],
    "title": "Learn RAG From Scratch",
    "creator": "freeCodeCamp.org / LangChain",
    "url": "https://www.youtube.com/watch?v=sVcwVQRHIc8",
    "type": "FULL COURSE",
    "duration": "2 hr 30 min",
    "level": "Intermediate",
    "whySelected": "Systematic breakdown of document indexing, retrieval strategies, query translation, routing, and RAG generation from scratch.",
    "whatItTeaches": "Document indexing, semantic chunking, vector store retrieval, query translation, routing, query construction, and end-to-end RAG generation pipelines.",
    "selectedSections": "Focus on: Indexing (document parsing, chunking, vector store), Retrieval (semantic search, hybrid retrieval), Generation (RAG chain), Query Translation, Routing, Query Construction. Use LLM Zoomcamp (R24) for hit rate/MRR/evaluation metrics.",
    "skip": "Overly complex multi-agent frameworks before single-loop RAG is working; retrieval metric evaluation belongs in LLM Zoomcamp",
    "doneWhen": "You can build a working RAG pipeline covering indexing, retrieval, and generation, with query routing and translation strategies.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT15",
    "nodeIds": [
      "system-design",
      "cloud-fundamentals"
    ],
    "title": "System Design for Beginners Course",
    "creator": "freeCodeCamp.org / Gaurav Sen",
    "url": "https://www.youtube.com/watch?v=m8Icp_Cid5o",
    "type": "FULL COURSE",
    "duration": "~1 hr 25 min",
    "level": "Beginner",
    "whySelected": "Visual architectural breakdown of load balancing, caching, database partitioning, microservices, asynchronous queues, and CAP theorem trade-offs.",
    "whatItTeaches": "Client-server architecture, DNS/TCP, reverse proxies, CDNs, caching strategies, SQL vs NoSQL, database replication/sharding, message queues, and reliability.",
    "selectedSections": "All fundamental architectural building blocks",
    "skip": "Hyperscale distributed consensus algorithms (Paxos/Raft) until needed",
    "doneWhen": "You can design and draw an end-to-end system architecture with identified failure points, caching layers, and database boundaries.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT16",
    "nodeIds": [
      "ai-security",
      "software-security"
    ],
    "title": "OWASP Top 10 for LLMs and AI Security",
    "creator": "OWASP Foundation / Security Community",
    "url": "https://www.youtube.com/watch?v=0kF5lR4w31U",
    "type": "TARGETED LECTURE",
    "duration": "1 hr 15 min",
    "level": "Intermediate",
    "whySelected": "Practical security threat-modeling for LLMs: prompt injection, insecure output handling, model theft, tool privilege escalation, and data poisoning.",
    "whatItTeaches": "Direct/indirect prompt injection, guardrails, least-privilege tool access, sandboxing code execution, and data sanitization.",
    "selectedSections": "Prompt Injection, Excessive Agency, Insecure Output Handling",
    "skip": "Generic compliance policy slides",
    "doneWhen": "You can threat-model an AI tool-using system and implement input sanitization and execution boundaries.",
    "lastVerified": "26 Aug 2026",
    "status": "NEEDS YOUTUBE VERIFICATION"
  },
  {
    "id": "YT17",
    "nodeIds": [
      "python-engineering",
      "git-workflow",
      "debugging",
      "code-quality",
      "linux-cli"
    ],
    "title": "The Missing Semester of Your CS Education 2026",
    "creator": "MIT OpenCourseWare (Anish Athalye, Jon Gjengset, Jose Javier Gonzalez Ortiz)",
    "url": "https://missing.csail.mit.edu/2026/",
    "type": "LECTURE SERIES",
    "duration": "9 lectures (~15 hr total)",
    "level": "Beginner to Intermediate",
    "whySelected": "The definitive course on professional developer tooling: shell mastery, command-line environment, development tooling, debugging and profiling, version control, and code quality.",
    "whatItTeaches": "Shell navigation, command-line environment, development environment and tools, debugging and profiling, Git version control, packaging and shipping, agentic coding (informational), security essentials, code quality.",
    "selectedSections": "Capability-specific: python-engineering → L2 Command-line Environment, L3 Development Environment and Tools, L6 Packaging and Shipping Code, L9 Code Quality; git-workflow → L5 Version Control and Git, L8 Beyond the Code; debugging → L4 Debugging and Profiling, L9 Code Quality; code-quality → L3 Development Environment and Tools, L9 Code Quality; linux-cli → L1 Introduction to the Shell, L2 Command-line Environment",
    "skip": "L7 Agentic Coding is informational only — do not treat as a SWE Core prerequisite; skip deep cryptographic math",
    "doneWhen": "You can use the shell comfortably, write automation scripts, navigate Git history, and profile code execution.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT18",
    "nodeIds": [
      "pandas-eda"
    ],
    "title": "Complete Python Pandas Data Analysis Tutorial",
    "creator": "Keith Galli",
    "url": "https://www.youtube.com/watch?v=vmEHCJofslg",
    "type": "FULL COURSE",
    "duration": "~1 hr",
    "level": "Beginner",
    "whySelected": "Practical, focused Pandas tutorial covering real-world data loading, filtering, aggregation, groupby, and data cleaning workflows.",
    "whatItTeaches": "Pandas DataFrame creation, loading CSV/Excel data, filtering rows, selecting columns, groupby and aggregation, handling missing values, sorting, and data cleaning.",
    "selectedSections": "Focus on: Loading data, filtering and selecting, groupby and aggregation, handling missing values, data cleaning patterns",
    "skip": "Advanced multi-index and time-series sections unless project requires them. For NumPy, use R33 (NumPy official documentation).",
    "doneWhen": "You can load raw tabular data, clean missing values, compute group aggregations, and prepare a DataFrame for ML modeling.",
    "lastVerified": "26 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "YT19",
    "nodeIds": [
      "agents",
      "mcp"
    ],
    "title": "Hugging Face Agents Course – Fundamentals and Tool Design",
    "creator": "Hugging Face",
    "url": "https://www.youtube.com/watch?v=qUfZW4y_G4Q",
    "type": "CRASH COURSE",
    "duration": "~1 hr 30 min",
    "level": "Intermediate",
    "whySelected": "Clear conceptual and practical guide to model-driven agent loops, tool schemas, function calling, and execution boundaries from the Hugging Face Agents Course.",
    "whatItTeaches": "ReAct agent loops, tool registration, execution parsing, multi-step error handling, and trajectory evaluation.",
    "selectedSections": "Agent Foundations (Unit 1), Tool Design and Tool-Calling (Unit 2), Evaluation and Observability",
    "skip": "Framework-specific boilerplate; focus on durable architecture principles",
    "doneWhen": "You can build an agent with typed tool contracts and measure task success, trajectories, and failure rates.",
    "lastVerified": "26 Aug 2026",
    "status": "NEEDS YOUTUBE VERIFICATION"
  },
  {
    "id": "YT20",
    "nodeIds": [
      "ai-observability",
      "ai-reliability",
      "ai-economics",
      "feedback-loops"
    ],
    "title": "Production LLMOps & Evaluation in Practice",
    "creator": "Arize AI / OpenTelemetry AI Community",
    "url": "https://www.youtube.com/watch?v=0B5eIE_1-2I",
    "type": "DEEP DIVE",
    "duration": "~1 hr 45 min",
    "level": "Intermediate",
    "whySelected": "Focused walkthrough on observability, distributed tracing, error attribution, latency budgeting, and continuous evaluation for AI systems.",
    "whatItTeaches": "OpenTelemetry tracing for LLMs, prompt/model token cost analysis, latency attribution waterfalls, and regression testing.",
    "selectedSections": "Tracing, Latency Optimization, and Regression Test Loops",
    "skip": "Proprietary enterprise sales demos",
    "doneWhen": "You can instrument AI services with distributed traces, measure latency/costs, and protect against quality regressions.",
    "lastVerified": "26 Aug 2026",
    "status": "NEEDS YOUTUBE VERIFICATION"
  }
];

  const aiNativeEngineering = {
  "title": "AI-Native Engineering Working Principle",
  "summary": "AI is a permanent acceleration tool for coding, debugging, and research. However, independent technical ownership remains mandatory.",
  "workingMethod": "Use AI to draft boilerplate, explore alternatives, explain error messages, and accelerate test writing. Never commit code, architecture, or configurations you cannot independently explain, verify, debug, and justify.",
  "aiIndependentFloor": [
    "Explain the complete system architecture, request lifecycle, and data flow without AI assistance",
    "Systematically reproduce and isolate bugs using debugger, logs, and root cause analysis",
    "Write baseline tests and verify boundary failure modes independently",
    "Threat-model security surfaces and enforce least-privilege permissions",
    "Justify technical trade-offs (e.g. SQL vs NoSQL, sync vs async, local vs cloud model) based on measurable requirements"
  ]
};

  const phases = [
  {
    "id": "swe-core",
    "order": 1,
    "name": "Software Engineering Core",
    "summary": "Become able to build, debug, test, containerize and reason about properly engineered software.",
    "why": "This is the minimum engineering foundation before serious ML progression—not the end of learning software engineering.",
    "prerequisites": "Current engineering foundation: programming, application building, Git exposure and real production contribution.",
    "proof": "Production Engineering Upgrade of the best existing project.",
    "unlocks": "Math + Data as a major track, while Professional SWE Depth continues in parallel.",
    "nodes": [
      {
        "id": "python-engineering",
        "name": "Python engineering",
        "evidenceStatus": "partial",
        "weight": 3,
        "summary": "Application ability is proven; professional structure, typing, packaging and test evidence need depth.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Professional Python engineering means organizing Python code so another engineer can understand, test, configure and change it safely.",
        "why": "Application experience is already present; this closes the gap between code that works once and code that remains maintainable.",
        "teaches": [
          "Modules and clean boundaries",
          "Errors and configuration",
          "Typing where useful",
          "Dependency/environment management"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Python engineering evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Python engineering to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Python engineering.",
        "prerequisites": [],
        "cover": [
          "Modules and clean boundaries",
          "Errors and configuration",
          "Typing where useful",
          "Dependency/environment management"
        ],
        "skip": [
          "Beginner Python"
        ],
        "proof": "A clean Python service or package with tests and maintainable structure.",
        "ready": "",
        "resourceIds": [
          "R1"
        ],
        "evidenceBasis": [
          "Resume: Flask, FastAPI, local AI and pandas applications"
        ],
        "handsOnLab": {
          "title": "Professional Python Package & Virtual Environment Lab",
          "goal": "Structure a Python application with clean imports, type hints, and isolated virtual environment",
          "steps": [
            "Create an isolated virtual environment using venv and pin dependencies with exact versions in requirements.txt",
            "Organize code into a clean package structure with __init__.py files and absolute imports",
            "Add type hints to all function signatures and verify type correctness using mypy",
            "Configure pyproject.toml / ruff for automatic code formatting and linting",
            "Execute the application via a modular entry point (e.g. python -m my_package.main)"
          ],
          "expectedResult": "A cleanly packaged Python repository that installs and executes deterministically across machines.",
          "stretch": "Build a distribution wheel using python -m build and install it in a clean environment.",
          "completionCheck": "You can organize Python code with virtual environments, type hints, linters, and clean package structure."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Python engineering to another engineer without reading code verbatim.",
        "completionCheck": "You can organize Python code with virtual environments, type hints, linters, and clean package structure."
      },
      {
        "id": "git-workflow",
        "name": "Production Git / PR workflow",
        "evidenceStatus": "likely-proven",
        "weight": 2,
        "summary": "Real Jira → branch → PR → review/QA work is reported; attach one representative artifact.",
        "defaultProgress": "in-progress",
        "whatIsThis": "A production Git workflow turns changes into small, reviewable commits and pull requests with a clear history.",
        "why": "Teams need to understand what changed, review it safely and recover when changes conflict or fail.",
        "teaches": [
          "Branches and clean commits",
          "Diff review and conflicts",
          "Repository history"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Production Git / PR workflow evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Production Git / PR workflow to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Production Git / PR workflow.",
        "prerequisites": [],
        "cover": [
          "Branches and clean commits",
          "Diff review and conflicts",
          "Repository history"
        ],
        "skip": [],
        "proof": "Inspect or attach one real production PR.",
        "ready": "",
        "resourceIds": [
          "R1"
        ],
        "evidenceBasis": [
          "Resume: production contribution workflow"
        ],
        "handsOnLab": {
          "title": "Feature Branching, Rebase & Pull Request Lab",
          "goal": "Practice professional Git workflow: feature branches, atomic commits, rebasing, and PR review hygiene",
          "steps": [
            "Create a feature branch from main (git checkout -b feature/user-auth)",
            "Make small, atomic commits with descriptive conventional commit messages (feat: add password hashing)",
            "Simulate a team merge on main and rebase your feature branch cleanly (git fetch origin && git rebase origin/main)",
            "Resolve any merge conflicts deliberately, verifying code integrity after conflict resolution",
            "Open a pull request with a structured description: Problem, Solution, Verification, and Risk"
          ],
          "expectedResult": "A clean linear commit history and a high-signal pull request suitable for team review.",
          "stretch": "Perform an interactive rebase (git rebase -i) to squash typo/fixup commits into clean units.",
          "completionCheck": "You can use feature branches, rebase cleanly, resolve conflicts, and submit review-ready pull requests."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Production Git / PR workflow to another engineer without reading code verbatim.",
        "completionCheck": "You can use feature branches, rebase cleanly, resolve conflicts, and submit review-ready pull requests."
      },
      {
        "id": "debugging",
        "name": "Systematic debugging",
        "evidenceStatus": "likely-proven",
        "weight": 3,
        "summary": "Production fixes imply ability; make the method and regression evidence inspectable.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Systematic debugging is a repeatable way to reproduce a failure, narrow its cause, fix it and prevent it from returning.",
        "why": "Guessing may fix a symptom; a disciplined method produces reliable fixes and evidence that the underlying problem is understood.",
        "teaches": [
          "Reproduce and isolate",
          "Stack traces, debugger and logs",
          "Hypothesis-driven diagnosis",
          "Regression tests"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Systematic debugging evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Systematic debugging to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Systematic debugging.",
        "prerequisites": [],
        "cover": [
          "Reproduce and isolate",
          "Stack traces, debugger and logs",
          "Hypothesis-driven diagnosis",
          "Regression tests"
        ],
        "skip": [],
        "proof": "Document one difficult bug from reproduction through regression protection.",
        "ready": "",
        "resourceIds": [
          "R1"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Systematic Bug Isolation & Root Cause Lab",
          "goal": "Reproduce a difficult failure, isolate root cause with a debugger, and implement regression test",
          "steps": [
            "Create a minimal reproducible example (MRE) that triggers the bug consistently",
            "Use the Python interactive debugger (pdb / breakpoint() / VS Code debugger) to step through variables",
            "Formulate and test explicit hypotheses about the failure cause before making code edits",
            "Implement the minimal fix that addresses the root cause rather than masking symptoms",
            "Write an automated regression test that fails before the fix and passes after the fix"
          ],
          "expectedResult": "A permanent bug fix accompanied by an automated regression test that prevents recurrence.",
          "stretch": "Write a short post-mortem explaining the bug mechanics, blast radius, and preventive measures.",
          "completionCheck": "You can systematically isolate bugs using debuggers/logs, identify root causes, and write regression tests."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Systematic debugging to another engineer without reading code verbatim.",
        "completionCheck": "You can systematically isolate bugs using debuggers/logs, identify root causes, and write regression tests."
      },
      {
        "id": "testing",
        "name": "Testing fundamentals",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Systematic unit, integration, API and regression testing is the largest immediate evidence gap.",
        "defaultProgress": "not-started",
        "whatIsThis": "Automated tests are code that checks whether other code behaves correctly, including when inputs or dependencies fail.",
        "why": "Tests make refactoring and releases safer because important regressions are caught before users find them.",
        "teaches": [
          "Unit and integration/API tests",
          "Fixtures and failure cases",
          "Regression tests",
          "Deterministic automation"
        ],
        "whyNow": "Testing is the first unresolved Core dependency. Docker and CI become useful evidence only after important behavior can be checked automatically.",
        "careerConnection": "Reliable tests turn existing Python and backend experience into stronger SWE internship and junior-engineer evidence.",
        "miniExercise": "Write one passing test, deliberately break the behavior to see the test fail, restore it, then add one failure-case test.",
        "projectApplication": "Protect one real Project 1 workflow with a small unit test and one integration or API test.",
        "unlocks": "A meaningful automated test suite, then Basic CI as a real quality gate.",
        "prerequisites": [],
        "cover": [
          "Unit and integration/API tests",
          "Fixtures and failure cases",
          "Regression tests",
          "Deterministic automation"
        ],
        "skip": [
          "100% coverage as a target"
        ],
        "proof": "A serious repository where CI would catch meaningful regressions.",
        "ready": "",
        "resourceIds": [
          "R4",
          "R5"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "pytest Regression Protection Lab",
          "goal": "Write unit and failure-case tests that prevent real regression in an application service",
          "steps": [
            "Identify a core business logic function in your project (e.g. auth check, pricing formula, or data filter)",
            "Write a pytest test covering the expected valid input and output (happy path)",
            "Write tests covering at least 2 edge/failure cases (e.g. empty input, invalid format, missing field, permission failure)",
            "Deliberately modify application code to introduce a subtle bug and verify that pytest catches it immediately",
            "Add pytest-cov to measure line and branch test coverage across the tested module"
          ],
          "expectedResult": "Test suite runs in under 2 seconds, passes on good code, and fails with clear diagnostics on regressions.",
          "stretch": "Add a parameterized test with @pytest.mark.parametrize testing 5 distinct boundary inputs.",
          "completionCheck": "You can write unit/integration tests and fixtures for an API or library."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Testing fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can write unit/integration tests and fixtures for an API or library."
      },
      {
        "id": "code-quality",
        "name": "Code quality and maintainability",
        "evidenceStatus": "partial",
        "weight": 3,
        "summary": "Existing applications demonstrate organization, but automated quality controls need stronger proof.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Code quality is the structure and automated discipline that keeps software readable, consistent and safe to change.",
        "why": "A serious project must remain understandable after it grows or another engineer joins it.",
        "teaches": [
          "Formatting and linting",
          "Separation of concerns",
          "Documentation",
          "Pre-commit automation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Code quality and maintainability evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Code quality and maintainability to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Code quality and maintainability.",
        "prerequisites": [],
        "cover": [
          "Formatting and linting",
          "Separation of concerns",
          "Documentation",
          "Pre-commit automation"
        ],
        "skip": [],
        "proof": "Apply maintainability tooling to the selected Project 1 repository.",
        "ready": "",
        "resourceIds": [
          "R1"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Automated Linting, Formatting & Type Checking Lab",
          "goal": "Set up an automated quality gate with Ruff, Black, and Mypy in pre-commit hooks",
          "steps": [
            "Install and configure Ruff for ultra-fast linting and code formatting",
            "Configure Mypy with strict type checking options in pyproject.toml",
            "Install pre-commit and create a .pre-commit-config.yaml running linters and formatters on git commit",
            "Run pre-commit run --all-files across the repository and resolve all flagged issues",
            "Verify that attempting to commit unformatted or ill-typed code is automatically blocked"
          ],
          "expectedResult": "Automated local and CI enforcement ensuring 100% compliant code style and type safety.",
          "stretch": "Add a static security analysis check (e.g. bandit) to the pre-commit configuration.",
          "completionCheck": "You can configure and enforce automated linters, formatters, and type checkers across a repository."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Code quality and maintainability to another engineer without reading code verbatim.",
        "completionCheck": "You can configure and enforce automated linters, formatters, and type checkers across a repository."
      },
      {
        "id": "http-api",
        "name": "HTTP + API fundamentals",
        "evidenceStatus": "likely-proven",
        "weight": 4,
        "summary": "Web/API work suggests familiarity; protocol-level reasoning should be verified once.",
        "defaultProgress": "in-progress",
        "whatIsThis": "HTTP is the request-and-response language used by browsers, APIs and web services to communicate.",
        "why": "Backend and AI services depend on correct methods, status codes, headers, caching, authentication and failure handling.",
        "teaches": [
          "HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)",
          "Status codes (2xx, 3xx, 4xx, 5xx)",
          "Headers, cookies, Content-Type and CORS",
          "DNS resolution, TCP connection handshake, and TLS/HTTPS encryption",
          "Reverse proxies, load balancers, and X-Forwarded headers",
          "Caching strategies (Cache-Control, ETag, 304 Not Modified)",
          "Authentication tokens (Bearer, JWT, session cookies)",
          "Timeout handling, retries and rate limiting"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens HTTP + API fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply HTTP + API fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require HTTP + API fundamentals.",
        "prerequisites": [],
        "cover": [
          "HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)",
          "Status codes (2xx, 3xx, 4xx, 5xx)",
          "Headers, cookies, Content-Type and CORS",
          "DNS resolution, TCP connection handshake, and TLS/HTTPS encryption",
          "Reverse proxies, load balancers, and X-Forwarded headers",
          "Caching strategies (Cache-Control, ETag, 304 Not Modified)",
          "Authentication tokens (Bearer, JWT, session cookies)",
          "Timeout handling, retries and rate limiting"
        ],
        "skip": [],
        "proof": "Diagnose one API flow with devtools or curl and explain browser → DNS/TLS → server → DB → response.",
        "ready": "",
        "resourceIds": [
          "R2"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "HTTP Protocol & Reverse Proxy Inspection Lab",
          "goal": "Trace and dissect raw HTTP requests, status codes, headers, and reverse proxy routing",
          "steps": [
            "Use curl -v to inspect raw HTTP request and response headers for an API endpoint",
            "Implement semantic HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity, 500 Internal Error",
            "Configure Cache-Control headers and observe 304 Not Modified behavior with ETag / If-None-Match",
            "Configure a reverse proxy (Nginx or Caddy) to route requests, forward X-Forwarded-For headers, and terminate TLS",
            "Explain the relationship between DNS lookup, TCP 3-way handshake, TLS negotiation, and HTTP payload transfer"
          ],
          "expectedResult": "Full visibility into request/response lifecycle, header propagation, caching, and proxy behavior.",
          "stretch": "Simulate a network timeout or connection reset and verify client error handling.",
          "completionCheck": "You can trace HTTP/API requests, explain DNS/TCP/TLS/proxy roles, and configure headers, status codes, and error responses."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of HTTP + API fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can trace HTTP/API requests, explain DNS/TCP/TLS/proxy roles, and configure headers, status codes, and error responses."
      },
      {
        "id": "relational-db",
        "name": "SQL + relational database fundamentals",
        "evidenceStatus": "partial",
        "weight": 4,
        "summary": "SQLite/Postgres/Supabase are real evidence; transactions, indexes and query analysis remain gaps.",
        "defaultProgress": "in-progress",
        "whatIsThis": "A relational database stores structured data in tables whose relationships and rules can be enforced.",
        "why": "Correct schemas, transactions and indexes protect data and keep application queries dependable as usage grows.",
        "teaches": [
          "Schema and integrity constraints",
          "Joins and transactions",
          "Practical indexes",
          "Basic EXPLAIN and migrations"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens SQL + relational database fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply SQL + relational database fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require SQL + relational database fundamentals.",
        "prerequisites": [],
        "cover": [
          "Schema and integrity constraints",
          "Joins and transactions",
          "Practical indexes",
          "Basic EXPLAIN and migrations"
        ],
        "skip": [],
        "proof": "A normalized schema with justified indexes, migrations and transaction boundaries.",
        "ready": "",
        "resourceIds": [
          "R3"
        ],
        "evidenceBasis": [
          "Resume: Pawnstone Postgres/RLS and SQLite apps"
        ],
        "handsOnLab": {
          "title": "PostgreSQL Schema, Constraints & EXPLAIN Lab",
          "goal": "Design normalized tables with foreign key constraints, ACID transactions, and query index optimization",
          "steps": [
            "Design a relational schema with at least 3 related tables with primary/foreign keys and NOT NULL / UNIQUE constraints",
            "Write a transaction block (BEGIN...COMMIT / ROLLBACK) that transfers ownership or logs an event atomically",
            "Write a complex SELECT query joining all 3 tables with filtering and aggregation",
            "Run EXPLAIN ANALYZE on the query to inspect sequential scans vs index scans",
            "Create a targeted B-tree index on a frequently filtered column and measure execution time drop with EXPLAIN ANALYZE"
          ],
          "expectedResult": "Data integrity is enforced at the database level and queries execute with efficient index scans.",
          "stretch": "Implement a database migration script that safely adds a column with a default value without locking large tables.",
          "completionCheck": "You can design relational schemas, write multi-table joins, enforce constraints/transactions, and optimize queries with EXPLAIN."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of SQL + relational database fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can design relational schemas, write multi-table joins, enforce constraints/transactions, and optimize queries with EXPLAIN."
      },
      {
        "id": "backend",
        "name": "Backend fundamentals",
        "evidenceStatus": "partial",
        "weight": 4,
        "summary": "Flask, FastAPI and Supabase provide real exposure; production backend ownership needs depth.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Backend engineering is the server-side work that receives requests, applies business rules, reads or writes data and returns safe responses.",
        "why": "Existing Flask and FastAPI exposure becomes stronger evidence when the service has clear boundaries, validation, security, database access and tests.",
        "teaches": [
          "Routes and validation",
          "Service/business logic",
          "Database access",
          "Authorization, errors and configuration"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Backend fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Backend fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Backend fundamentals.",
        "prerequisites": [],
        "cover": [
          "Routes and validation",
          "Service/business logic",
          "Database access",
          "Authorization, errors and configuration"
        ],
        "skip": [],
        "proof": "A non-trivial backend change with tests and clear service/API boundaries.",
        "ready": "",
        "resourceIds": [
          "R32",
          "R3",
          "R4",
          "R5"
        ],
        "evidenceBasis": [
          "Resume: Flask, FastAPI, Supabase Edge Functions"
        ],
        "handsOnLab": {
          "title": "FastAPI Service Architecture & Validation Lab",
          "goal": "Build a modular, validated backend API service with dependency injection and error handling",
          "steps": [
            "Structure a FastAPI project with routers, schemas, services, and models in separate directories",
            "Define request and response schemas using Pydantic with strict field validation and documentation",
            "Implement dependency injection for database sessions and authentication tokens",
            "Implement a global exception handler that returns structured, consistent JSON error responses",
            "Write integration tests covering happy paths, authentication failures, and validation errors"
          ],
          "expectedResult": "A clean, modular API service with auto-generated Swagger docs (/docs) and robust error handling.",
          "stretch": "Add rate limiting or request ID middleware to trace incoming requests.",
          "completionCheck": "You can build and structure a validated, tested backend API service with clean boundaries and database access."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Backend fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can build and structure a validated, tested backend API service with clean boundaries and database access."
      },
      {
        "id": "dsa",
        "name": "DSA + problem solving foundations",
        "evidenceStatus": "likely-proven",
        "weight": 2,
        "summary": "CS50 and Computer Engineering suggest foundations; interview readiness needs a targeted diagnostic.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Data structures and algorithms are common ways to organize data and solve problems with predictable time and memory costs.",
        "why": "Targeted practice supports interviews and helps you reason about performance without turning ATLAS into a competitive-programming plan.",
        "teaches": [
          "Core structures",
          "Common patterns",
          "Complexity and edge cases"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens DSA + problem solving foundations evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply DSA + problem solving foundations to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require DSA + problem solving foundations.",
        "prerequisites": [],
        "cover": [
          "Core structures",
          "Common patterns",
          "Complexity and edge cases"
        ],
        "skip": [
          "Daily quotas",
          "Competitive-programming grind"
        ],
        "proof": "Solve and explain a representative unseen interview problem, including tests and complexity.",
        "ready": "",
        "resourceIds": [
          "R11"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Algorithmic Problem-Solving & Complexity Lab",
          "goal": "Implement core data structures and analyze Big-O time and space complexity",
          "steps": [
            "Implement a Hash Map / Frequency Counter pattern to solve Two Sum or Group Anagrams",
            "Implement a Two-Pointer or Sliding Window pattern for substring/subarray optimization",
            "Implement a Tree Traversal (BFS and DFS) on a Binary Search Tree",
            "Write down the formal time and space complexity analysis for each solution",
            "Test solutions against empty, single-element, duplicate, and large inputs"
          ],
          "expectedResult": "Clean, idiomatic implementations that handle edge cases and execute within optimal Big-O bounds.",
          "stretch": "Explain the trade-offs between O(log N) and O(N) searching in sorted vs unsorted data.",
          "completionCheck": "You can identify common data structure patterns, explain time/space trade-offs, and solve representative problems."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of DSA + problem solving foundations to another engineer without reading code verbatim.",
        "completionCheck": "You can identify common data structure patterns, explain time/space trade-offs, and solve representative problems."
      },
      {
        "id": "linux-cli",
        "name": "Linux + CLI fundamentals",
        "evidenceStatus": "likely-proven",
        "weight": 2,
        "summary": "Local AI and tooling imply regular CLI use; attach practical evidence once.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Linux and command-line fundamentals let you inspect files, processes, permissions, logs and environment settings directly.",
        "why": "Servers, containers, CI jobs and many engineering tools expose their clearest controls through the shell.",
        "teaches": [
          "Filesystem and permissions",
          "Processes and environment",
          "Pipes and inspection tools"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Linux + CLI fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Linux + CLI fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Linux + CLI fundamentals.",
        "prerequisites": [],
        "cover": [
          "Filesystem and permissions",
          "Processes and environment",
          "Pipes and inspection tools"
        ],
        "skip": [],
        "proof": "Demonstrate a real debugging or project workflow using shell tooling.",
        "ready": "",
        "resourceIds": [
          "R1"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Linux Shell Navigation, Processes & Logs Lab",
          "goal": "Inspect running processes, analyze system logs, and manage permissions from the terminal",
          "steps": [
            "Navigate directories, search file contents using grep / ripgrep, and manipulate text with awk/sed",
            "Inspect running processes using ps aux, top, and kill; inspect open ports using netstat / lsof -i",
            "Manage file permissions and ownership using chmod and chown",
            "Tail and filter real-time application logs using tail -f and grep",
            "Write a multi-line Bash shell script that automates a diagnostic check and exits with appropriate exit codes"
          ],
          "expectedResult": "Fluent command-line proficiency for server inspection, process management, and log debugging.",
          "stretch": "Write a cron job or systemd service unit file that runs a background health check.",
          "completionCheck": "You can navigate Linux, inspect processes, manage permissions, and diagnose logs via the shell."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Linux + CLI fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can navigate Linux, inspect processes, manage permissions, and diagnose logs via the shell."
      },
      {
        "id": "docker",
        "name": "Docker fundamentals",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "No strong current artifact demonstrates containerization.",
        "defaultProgress": "not-started",
        "whatIsThis": "Docker packages an application with the environment it needs so it can run consistently on another computer or server.",
        "why": "This is the bridge from “it works on my laptop” to a repeatable development and deployment environment.",
        "teaches": [
          "Images, containers and layers",
          "Ports, volumes and networks",
          "Compose and container debugging"
        ],
        "whyNow": "Containerization follows the first useful tests so the same checked application can run consistently beyond one laptop.",
        "careerConnection": "Docker is common evidence for backend, SWE, ML engineering and deployment-oriented roles.",
        "miniExercise": "Build the image, run the container with one mapped port, stop it, and rebuild after changing one dependency.",
        "projectApplication": "Make the real application start from documented Docker or Compose commands without hidden local setup.",
        "unlocks": "Basic CI packaging checks and a credible path to deployment.",
        "prerequisites": [
          "Backend fundamentals",
          "Linux/CLI basics"
        ],
        "cover": [
          "Images, containers and layers",
          "Ports, volumes and networks",
          "Compose and container debugging"
        ],
        "skip": [
          "Kubernetes",
          "Swarm"
        ],
        "proof": "Another engineer can clone and run the serious project with docker compose up.",
        "ready": "",
        "resourceIds": [
          "R6"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Multi-Stage Containerization Lab",
          "goal": "Package a backend application into a minimal, reproducible Docker container",
          "steps": [
            "Create a .dockerignore file to exclude virtual environments, cache files, and sensitive credentials",
            "Write a Dockerfile with a clean base image (e.g. python:3.11-slim)",
            "Define WORKDIR, copy requirements.txt, install dependencies, and copy application source code",
            "Build the image using docker build -t my-service:v1 .",
            "Run the container with port binding and environment variables: docker run -p 8000:8000 --env-file .env my-service:v1",
            "Verify the running service via curl or browser and inspect container execution logs with docker logs"
          ],
          "expectedResult": "Application runs in the container identically to the host with zero host dependency leaks.",
          "stretch": "Write a docker-compose.yml file that launches the backend alongside a local PostgreSQL database container.",
          "completionCheck": "You can build an image, run the app in a container, configure ports/env variables, and debug basic container issues."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Docker fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can build an image, run the app in a container, configure ports/env variables, and debug basic container issues."
      },
      {
        "id": "basic-ci",
        "name": "Basic CI",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Automated PR checks are not yet demonstrated.",
        "defaultProgress": "not-started",
        "whatIsThis": "Continuous integration automatically runs checks such as formatting, tests and builds whenever code changes.",
        "why": "It gives every pull request fast, repeatable feedback and prevents known failures from being merged.",
        "teaches": [
          "Format/lint",
          "Tests",
          "Build/check"
        ],
        "whyNow": "CI should automate checks that already matter. Tests come first; the workflow comes next.",
        "careerConnection": "A visible pull-request check proves that quality controls are repeatable and team-ready.",
        "miniExercise": "Push a temporary failing test, observe the red check, fix it, and preserve the successful run in the pull-request history.",
        "projectApplication": "Run Project 1 tests, formatting or linting, and the build automatically on pull requests.",
        "unlocks": "Safer releases and the production-deployment work in the parallel SWE-depth track.",
        "prerequisites": [
          "Git workflow",
          "Testing fundamentals"
        ],
        "cover": [
          "Format/lint",
          "Tests",
          "Build/check"
        ],
        "skip": [],
        "proof": "A pull request pipeline with meaningful passed and failed history.",
        "ready": "",
        "resourceIds": [
          "R7"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "GitHub Actions Pull Request Gate Lab",
          "goal": "Automate linting and test execution on every pull request to protect main branch",
          "steps": [
            "Create .github/workflows/ci.yml in your repository root",
            "Configure triggers for push and pull_request on main branch",
            "Set up a runner job (ubuntu-latest) with actions/checkout and actions/setup-python",
            "Add steps to install dependencies, run linter (e.g. ruff/flake8), and run pytest",
            "Open a draft pull request with a failing test to verify the CI check turns red and blocks merge",
            "Fix the test and verify the CI check turns green before merging"
          ],
          "expectedResult": "GitHub PR shows automated status checks that reliably pass/fail based on code correctness.",
          "stretch": "Add caching for pip dependencies with actions/cache to accelerate CI workflow execution.",
          "completionCheck": "A pull request automatically runs tests/checks and blocks broken merges without manual intervention."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Basic CI to another engineer without reading code verbatim.",
        "completionCheck": "A pull request automatically runs tests/checks and blocks broken merges without manual intervention."
      }
    ]
  },
  {
    "id": "math-data",
    "order": 2,
    "name": "Math + Data",
    "summary": "Verify the mathematics and data reasoning needed for rigorous ML; add calculus when deep learning needs it.",
    "why": "Enough linear algebra, probability and statistics should precede classical ML; calculus must not become an artificial gate before decision trees.",
    "prerequisites": "Software Engineering Core sufficiently strong. Data diagnostics may begin in parallel.",
    "proof": "Use mathematical and statistical reasoning correctly inside the ML project, not as disconnected certificate work.",
    "unlocks": "Classical Machine Learning and, with calculus/optimization, Deep Learning.",
    "nodes": [
      {
        "id": "linear-algebra",
        "name": "Linear algebra",
        "evidenceStatus": "likely-proven",
        "weight": 4,
        "summary": "Current evidence is insufficient; verify vectors, transformations, norms and similarity.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Linear algebra describes vectors, matrices and transformations—the shapes and operations used throughout data, embeddings and neural networks.",
        "why": "It makes similarity, dimensionality reduction and model calculations understandable instead of mysterious library calls.",
        "teaches": [
          "Vectors and matrices",
          "Basis and rank intuition",
          "Projections and norms",
          "Eigen/SVD/PCA intuition"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Linear algebra evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Linear algebra to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Linear algebra.",
        "prerequisites": [],
        "cover": [
          "Vectors and matrices",
          "Basis and rank intuition",
          "Projections and norms",
          "Eigen/SVD/PCA intuition"
        ],
        "skip": [
          "Proof-heavy abstract algebra"
        ],
        "proof": "Explain datasets and embeddings as vectors, matrix transformations and cosine/dot-product similarity.",
        "ready": "",
        "resourceIds": [
          "R12"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Vector Space & Matrix Transformations Lab",
          "goal": "Implement and visualize vector transformations, dot products, and cosine similarity in NumPy",
          "steps": [
            "Create 2D/3D vectors in NumPy and compute vector norms and scalar multiples",
            "Implement cosine similarity from scratch using dot products and norms",
            "Create a 2x2 transformation matrix (rotation/scaling) and apply it to a grid of coordinates",
            "Compute the determinant and explain whether the transformation preserves orientation and area",
            "Compute eigenvalues and eigenvectors using numpy.linalg.eig and explain their geometric meaning"
          ],
          "expectedResult": "Accurate numerical calculations paired with geometric intuition for similarity and projection.",
          "stretch": "Compute cosine similarity between 5 sample text embedding vectors and find the nearest neighbor.",
          "completionCheck": "You can explain vectors as representations, compute dot product / cosine similarity, and understand matrix transformations in ML."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Linear algebra to another engineer without reading code verbatim.",
        "completionCheck": "You can explain vectors as representations, compute dot product / cosine similarity, and understand matrix transformations in ML."
      },
      {
        "id": "probability-statistics",
        "name": "Probability + statistics",
        "evidenceStatus": "likely-proven",
        "weight": 5,
        "summary": "Listed historically, but inspectable evidence is weak. Verify once at the ML-math boundary.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Probability and statistics help describe uncertainty, samples, variation and what conclusions data can support.",
        "why": "ML evaluation is unreliable without reasoning about distributions, confidence, sampling and misleading correlations.",
        "teaches": [
          "Probability and Bayes",
          "Random variables and distributions",
          "Expectation, variance and covariance",
          "Sampling, confidence and hypothesis testing",
          "Likelihood and correlation vs causation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Probability + statistics evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Probability + statistics to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Probability + statistics.",
        "prerequisites": [],
        "cover": [
          "Probability and Bayes",
          "Random variables and distributions",
          "Expectation, variance and covariance",
          "Sampling, confidence and hypothesis testing",
          "Likelihood and correlation vs causation"
        ],
        "skip": [],
        "proof": "Apply correct statistical reasoning to evaluation and uncertainty in Project 2.",
        "ready": "",
        "resourceIds": [
          "R13",
          "R14"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Statistical Reasoning & Uncertainty Lab",
          "goal": "Calculate confidence intervals, evaluate sample variance, and test hypotheses on experimental data",
          "steps": [
            "Generate synthetic metric data with known distribution parameters (mean and standard deviation)",
            "Calculate sample mean, standard error, and 95% confidence interval for different sample sizes (N=10 vs N=1000)",
            "Perform a two-sample t-test comparing model A vs model B accuracy across multiple cross-validation folds",
            "Identify a case of Simpson's Paradox or confounding variable in a sample dataset",
            "Write a short interpretation explaining whether a 1% metric improvement is statistically significant or noise"
          ],
          "expectedResult": "Clear understanding of variance, sample size effects, p-values, and evaluation reliability.",
          "stretch": "Calculate Precision, Recall, and F1-score across different classification threshold cutoffs.",
          "completionCheck": "You can apply statistical reasoning to model evaluation, uncertainty, sampling variance, and metric significance."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Probability + statistics to another engineer without reading code verbatim.",
        "completionCheck": "You can apply statistical reasoning to model evaluation, uncertainty, sampling variance, and metric significance."
      },
      {
        "id": "calculus-optimization",
        "name": "Calculus + optimization",
        "evidenceStatus": "missing",
        "weight": 3,
        "summary": "Required before serious deep learning, not before every classical model.",
        "defaultProgress": "not-started",
        "whatIsThis": "Calculus and optimization explain how changing model parameters changes error and how training searches for better parameters.",
        "why": "This becomes essential for understanding gradient-based deep learning, but it should not delay classical models that do not need it.",
        "teaches": [
          "Derivatives and chain rule",
          "Partial derivatives and gradients",
          "Gradient descent and learning rate"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Calculus + optimization evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Calculus + optimization to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Calculus + optimization.",
        "prerequisites": [],
        "cover": [
          "Derivatives and chain rule",
          "Partial derivatives and gradients",
          "Gradient descent and learning rate"
        ],
        "skip": [
          "Advanced integration",
          "Vector-calculus theorems"
        ],
        "proof": "Explain and debug gradient-based learning behavior.",
        "ready": "",
        "resourceIds": [
          "R15",
          "R16"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Gradient Descent Optimization Lab",
          "goal": "Implement gradient descent from scratch in Python to minimize a loss function",
          "steps": [
            "Define a simple quadratic loss function (e.g. f(w) = (w - 3)^2 + 4) and its analytical derivative",
            "Implement the gradient descent update rule: w = w - lr * grad in a loop for 50 steps",
            "Observe and plot the convergence path for different learning rates (lr=0.01, lr=0.1, lr=1.1 causing divergence)",
            "Extend the function to two variables (f(w1, w2)) and compute partial derivatives",
            "Implement Momentum or Adam optimizer update rule and compare convergence speed against vanilla SGD"
          ],
          "expectedResult": "Visual and numerical proof of convergence to minimum and understanding of learning rate sensitivity.",
          "stretch": "Plot the loss surface and trajectory of optimization in 3D.",
          "completionCheck": "You can explain partial derivatives, compute gradients, and debug gradient-based optimization behavior."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Calculus + optimization to another engineer without reading code verbatim.",
        "completionCheck": "You can explain partial derivatives, compute gradients, and debug gradient-based optimization behavior."
      },
      {
        "id": "numpy",
        "name": "NumPy",
        "evidenceStatus": "likely-proven",
        "weight": 2,
        "summary": "Likely used through data/AI work; verify only if a diagnostic exposes gaps.",
        "defaultProgress": "in-progress",
        "whatIsThis": "NumPy provides fast numerical arrays for Python and introduces the shapes, indexing and vectorized operations used across ML tools.",
        "why": "Comfort with arrays makes pandas, scikit-learn and PyTorch data code much easier to reason about.",
        "teaches": [
          "Array shapes and broadcasting",
          "Vectorized operations",
          "Numerical intuition"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens NumPy evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply NumPy to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require NumPy.",
        "prerequisites": [],
        "cover": [
          "Array shapes and broadcasting",
          "Vectorized operations",
          "Numerical intuition"
        ],
        "skip": [
          "A full course without a gap"
        ],
        "proof": "Use NumPy competently in a real ML pipeline.",
        "ready": "",
        "resourceIds": [
          "R33"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "NumPy Vectorization & Broadcasting Lab",
          "goal": "Eliminate Python loops by writing high-performance vectorized array operations",
          "steps": [
            "Create multi-dimensional arrays and inspect their shape, dtype, strides, and memory layout",
            "Perform array slicing, boolean masking, and fancy indexing without modifying original data",
            "Implement batch matrix multiplication using broadcasting rules without nested loops",
            "Benchmark a vectorized NumPy calculation vs a pure Python for-loop (demonstrating 50x+ speedup)",
            "Implement standard normalization (Z-score scaling) across 2D feature matrix in one line of NumPy"
          ],
          "expectedResult": "Loop-free, fast numerical array operations utilizing NumPy SIMD vectorization.",
          "stretch": "Implement a vectorized Euclidean distance matrix calculation between two sets of points.",
          "completionCheck": "You can use NumPy array indexing, slicing, broadcasting, and vectorization competently in ML code."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of NumPy to another engineer without reading code verbatim.",
        "completionCheck": "You can use NumPy array indexing, slicing, broadcasting, and vectorization competently in ML code."
      },
      {
        "id": "pandas-eda",
        "name": "pandas + introductory EDA",
        "evidenceStatus": "already-proven",
        "weight": 2,
        "summary": "End-to-end cleaning, feature engineering, statistics and visualization are already documented.",
        "defaultProgress": "completed",
        "whatIsThis": "Exploratory data analysis uses tables, summaries and charts to understand a dataset before modelling it.",
        "why": "Existing evidence already proves the basics; the important next step is reusing that skill inside rigorous ML work.",
        "teaches": [
          "Exploratory data analysis uses tables, summaries and charts to understand a dataset before modelling it."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens pandas + introductory EDA evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply pandas + introductory EDA to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require pandas + introductory EDA.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Existing Financial EDA and Kaggle visualization artifacts.",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [
          "GitHub: Financial EDA repository",
          "Kaggle visualization project"
        ],
        "handsOnLab": {
          "title": "Exploratory Data Analysis & Cleaning Lab",
          "goal": "Clean raw dataset, engineer features, and visualize data distributions without data leakage",
          "steps": [
            "Load raw tabular data with missing values, inconsistent formats, and outliers",
            "Perform data cleaning: impute or drop missing values with justification, parse dates, cast types",
            "Compute summary statistics (median, IQR, skewness) and identify outlier distributions",
            "Generate correlation matrix and feature distribution plots (histograms, box plots)",
            "Document key domain findings and potential data collection biases before modeling"
          ],
          "expectedResult": "A clean, reproducible EDA notebook with explicit data validation and documented insights.",
          "stretch": "Write automated data validation assertions using pandas or Great Expectations.",
          "completionCheck": "You can clean, explore, and analyze datasets with statistics and visualization while documenting data assumptions."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of pandas + introductory EDA to another engineer without reading code verbatim.",
        "completionCheck": "You can clean, explore, and analyze datasets with statistics and visualization while documenting data assumptions."
      },
      {
        "id": "data-quality",
        "name": "Data quality and SQL data work",
        "evidenceStatus": "partial",
        "weight": 3,
        "summary": "Introductory data work exists; production-quality validation and leakage-aware data reasoning need depth.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Data quality work finds missing, invalid, inconsistent or misleading data and turns assumptions into explicit checks.",
        "why": "A model cannot rescue unusable data, and leakage or bad splits can make a weak system look falsely successful.",
        "teaches": [
          "Understand the dataset before modelling",
          "Missing, invalid and outlier values",
          "Feature quality and leakage",
          "Train/validation/test separation",
          "Reproducible preprocessing and validation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Data quality and SQL data work evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Data quality and SQL data work to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Data quality and SQL data work.",
        "prerequisites": [],
        "cover": [
          "Understand the dataset before modelling",
          "Missing, invalid and outlier values",
          "Feature quality and leakage",
          "Train/validation/test separation",
          "Reproducible preprocessing and validation"
        ],
        "skip": [],
        "proof": "Document data assumptions, validation and failure modes in Project 2.",
        "ready": "",
        "resourceIds": [
          "R17",
          "R18"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Leakage Audit & Data Validation Pipeline Lab",
          "goal": "Build a reproducible data preprocessing pipeline with strict train/val/test separation and leakage checks",
          "steps": [
            "Split raw data into Train (70%), Validation (15%), and Test (15%) BEFORE any preprocessing or scaling",
            "Fit preprocessors (scalers, encoders) ONLY on the training split, and transform val/test splits",
            "Perform an explicit leakage audit checking for temporal leakage, target proxy leakage, and group overlap",
            "Write schema validation checks that raise errors if input data types or ranges violate assumptions",
            "Measure model performance drop when intentional target leakage is removed to see true generalization"
          ],
          "expectedResult": "A zero-leakage, reproducible data pipeline where train/test isolation is strictly verified.",
          "stretch": "Implement a scikit-learn ColumnTransformer and Pipeline to bundle preprocessing and estimator.",
          "completionCheck": "You can design reproducible data pipelines with strict split isolation, validation checks, and leakage audits."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Data quality and SQL data work to another engineer without reading code verbatim.",
        "completionCheck": "You can design reproducible data pipelines with strict split isolation, validation checks, and leakage audits."
      }
    ]
  },
  {
    "id": "classical-ml",
    "order": 3,
    "name": "Classical Machine Learning",
    "summary": "Learn the complete model-development and evaluation loop, not merely how to call scikit-learn.",
    "why": "Rigorous ML begins with problem definition, baselines, correct splits, metrics, leakage prevention and error analysis.",
    "prerequisites": "SWE Core sufficiently strong; linear algebra, probability/statistics and data stack ready enough for the chosen problem.",
    "proof": "Project 2 — a domain-flexible Applied Classical ML project.",
    "unlocks": "ML Engineering and stronger Data / ML internship readiness.",
    "nodes": [
      {
        "id": "ml-problem-framing",
        "name": "Problem definition + baseline",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Define the target, user decision, cost of error and a credible simple baseline.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML problem framing connects a user decision to a measurable prediction target and a simple baseline.",
        "why": "Without a clear target and cost of error, model scores do not tell you whether the system is useful.",
        "teaches": [
          "ML problem framing connects a user decision to a measurable prediction target and a simple baseline."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Problem definition + baseline evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Problem definition + baseline to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Problem definition + baseline.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "A problem statement that makes model success and failure measurable.",
        "ready": "",
        "resourceIds": [
          "R17",
          "R18"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "ML Problem Definition & Baseline Lab",
          "goal": "Frame a real-world predictive task, define metrics, and establish a simple heuristic baseline",
          "steps": [
            "State the user/business decision, the exact prediction target (y), and available input features (X)",
            "Quantify the cost asymmetry of errors (e.g. False Positive vs False Negative cost)",
            "Select the primary evaluation metric (e.g. PR-AUC, F1-macro, MAE) and explain why Accuracy is insufficient",
            "Implement the simplest possible baseline (e.g. majority class classifier, mean predictor, or simple rule)",
            "Measure the baseline performance on the validation set as the benchmark to beat"
          ],
          "expectedResult": "A written one-page problem framing and code baseline that sets the standard for ML evaluation.",
          "stretch": "Add a simple linear model baseline to compare against the heuristic.",
          "completionCheck": "You can define a measurable ML problem target, choose appropriate metrics, and build a credible baseline."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Problem definition + baseline to another engineer without reading code verbatim.",
        "completionCheck": "You can define a measurable ML problem target, choose appropriate metrics, and build a credible baseline."
      },
      {
        "id": "ml-data-splits",
        "name": "Data preparation + split strategy",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Select train/validation/test logic appropriate to random, grouped or temporal data.",
        "defaultProgress": "not-started",
        "whatIsThis": "A split strategy separates data for training, model selection and final evaluation without leaking future or related information.",
        "why": "Incorrect splits can produce impressive metrics that disappear in real use.",
        "teaches": [
          "Data inspection",
          "Preprocessing",
          "Leakage prevention",
          "Split rationale"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Data preparation + split strategy evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Data preparation + split strategy to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Data preparation + split strategy.",
        "prerequisites": [],
        "cover": [
          "Data inspection",
          "Preprocessing",
          "Leakage prevention",
          "Split rationale"
        ],
        "skip": [],
        "proof": "Reproducible data pipeline with an explicit leakage audit.",
        "ready": "",
        "resourceIds": [
          "R17",
          "R18"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Leakage-Safe Data Split Strategy Lab",
          "goal": "Implement and justify random, temporal, or grouped data splitting strategies",
          "steps": [
            "Inspect dataset structure for temporal dependencies (time series) or entity clustering (users/devices)",
            "Implement StratifiedKFold for imbalanced classification OR TimeSeriesSplit for temporal data",
            "Verify that no single entity or group appears in both train and validation folds",
            "Calculate distribution statistics across folds to ensure balance and consistency",
            "Write an automated assertion verifying zero intersection between train and test IDs"
          ],
          "expectedResult": "Splits that faithfully simulate production deployment conditions without overestimating performance.",
          "stretch": "Simulate a production drift scenario by evaluating on an out-of-time test split.",
          "completionCheck": "You can choose and implement appropriate split strategies (random, stratified, grouped, time-based) without leakage."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Data preparation + split strategy to another engineer without reading code verbatim.",
        "completionCheck": "You can choose and implement appropriate split strategies (random, stratified, grouped, time-based) without leakage."
      },
      {
        "id": "ml-models",
        "name": "Regression, classification + trees",
        "evidenceStatus": "missing",
        "weight": 4,
        "summary": "Build enough model breadth to make justified comparisons.",
        "defaultProgress": "not-started",
        "whatIsThis": "Classical ML models learn patterns for regression or classification without deep neural networks.",
        "why": "Comparing simple linear models, trees and ensembles teaches when extra complexity actually improves the problem.",
        "teaches": [
          "Linear/logistic models",
          "Trees and ensembles",
          "Feature engineering",
          "Calibration and imbalance where relevant"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Regression, classification + trees evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Regression, classification + trees to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Regression, classification + trees.",
        "prerequisites": [],
        "cover": [
          "Linear/logistic models",
          "Trees and ensembles",
          "Feature engineering",
          "Calibration and imbalance where relevant"
        ],
        "skip": [],
        "proof": "Compare justified models rather than defaulting to one algorithm.",
        "ready": "",
        "resourceIds": [
          "R17",
          "R18",
          "R19"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Model Breadth & Comparison Lab",
          "goal": "Train, tune, and compare linear models, decision trees, and gradient boosted ensembles",
          "steps": [
            "Train a Logistic Regression / Ridge Regression baseline model on preprocessed features",
            "Train a Random Forest classifier/regressor and inspect feature importances",
            "Train a Gradient Boosted Tree (XGBoost / LightGBM) with hyperparameter tuning",
            "Evaluate all models using cross-validation on identical validation folds",
            "Compare models across accuracy, interpretability, training time, and inference latency"
          ],
          "expectedResult": "A structured model comparison table showing trade-offs between linear, tree, and ensemble methods.",
          "stretch": "Calibrate model prediction probabilities using CalibratedClassifierCV.",
          "completionCheck": "You can train, tune, and compare multiple classical ML models (linear, tree-based, ensembles) with justified trade-offs."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Regression, classification + trees to another engineer without reading code verbatim.",
        "completionCheck": "You can train, tune, and compare multiple classical ML models (linear, tree-based, ensembles) with justified trade-offs."
      },
      {
        "id": "ml-evaluation",
        "name": "Evaluation + error analysis",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Current evidence does not show rigorous metric selection, stability analysis or failure taxonomy.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML evaluation measures useful performance and studies where, for whom and why a model fails.",
        "why": "A single aggregate score can hide unstable, biased or operationally costly failure modes.",
        "teaches": [
          "Metric selection",
          "Cross-validation",
          "Hyperparameter selection",
          "Interpretability",
          "Error slices and limitations"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Evaluation + error analysis evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Evaluation + error analysis to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Evaluation + error analysis.",
        "prerequisites": [],
        "cover": [
          "Metric selection",
          "Cross-validation",
          "Hyperparameter selection",
          "Interpretability",
          "Error slices and limitations"
        ],
        "skip": [],
        "proof": "Explain what would make the result untrustworthy and what to test next.",
        "ready": "",
        "resourceIds": [
          "R17",
          "R18",
          "R19"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Error Analysis & Slice Evaluation Lab",
          "goal": "Dissect model failures, analyze error slices, and evaluate stability beyond single aggregate metrics",
          "steps": [
            "Generate a confusion matrix and classification report across all classes",
            "Plot precision-recall curves and ROC curves, selecting an optimal classification threshold",
            "Create a failure taxonomy: inspect top 20 worst false positive and false negative predictions",
            "Slice evaluation metrics across sub-populations or feature categories to detect hidden disparities",
            "Write an error analysis memo detailing what would make the model untrustworthy in production"
          ],
          "expectedResult": "Deep understanding of where and why the model fails, rather than relying on a single top-level score.",
          "stretch": "Use SHAP or tree feature importance to explain the top 5 erroneous predictions.",
          "completionCheck": "You can perform rigorous metric selection, threshold tuning, error slice analysis, and model diagnosis."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Evaluation + error analysis to another engineer without reading code verbatim.",
        "completionCheck": "You can perform rigorous metric selection, threshold tuning, error slice analysis, and model diagnosis."
      },
      {
        "id": "ml-reproducibility",
        "name": "Reproducible experiment",
        "evidenceStatus": "missing",
        "weight": 4,
        "summary": "Someone else should be able to reconstruct data, configuration, training and conclusions.",
        "defaultProgress": "not-started",
        "whatIsThis": "A reproducible experiment records the data, code, configuration and results needed to run it again.",
        "why": "Conclusions are not trustworthy if the experiment cannot be reconstructed or compared fairly.",
        "teaches": [
          "A reproducible experiment records the data, code, configuration and results needed to run it again."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Reproducible experiment evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Reproducible experiment to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Reproducible experiment.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Versioned code/config with deterministic experiment instructions and recorded results.",
        "ready": "",
        "resourceIds": [
          "R18",
          "R19"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Deterministic ML Experiment Lab",
          "goal": "Make data preprocessing, configuration, random seeds, and training runs 100% reproducible",
          "steps": [
            "Set all random seeds (random, numpy, model) to a deterministic value",
            "Extract all hyperparameters, file paths, and feature names into a YAML/JSON configuration file",
            "Write a clean CLI entrypoint (python train.py --config config.yaml) that runs the complete pipeline",
            "Save versioned model artifacts and recorded evaluation metrics to a structured output folder",
            "Run the script twice in a fresh environment and assert that output metrics and model weights match exactly"
          ],
          "expectedResult": "Anyone can clone the repository, run one command, and reproduce identical experiment results.",
          "stretch": "Containerize the training script using Docker for complete OS/dependency determinism.",
          "completionCheck": "You can structure versioned code, config, and deterministic scripts to reproduce training and results from scratch."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Reproducible experiment to another engineer without reading code verbatim.",
        "completionCheck": "You can structure versioned code, config, and deterministic scripts to reproduce training and results from scratch."
      }
    ]
  },
  {
    "id": "ml-engineering",
    "order": 4,
    "name": "ML Engineering",
    "summary": "Move from knowing ML to training, packaging, deploying, monitoring and updating an ML system.",
    "why": "Production roles reward reliable model systems, not notebooks alone.",
    "prerequisites": "Classical ML proof plus growing Professional SWE Depth: Docker, deployment, CI, cloud fundamentals and system-design reasoning.",
    "proof": "Project 3 — productionize the actual domain-flexible Project 2.",
    "unlocks": "Junior ML Engineer readiness and deeper Production AI work.",
    "nodes": [
      {
        "id": "experiment-tracking",
        "name": "Experiment tracking + artifacts",
        "evidenceStatus": "missing",
        "weight": 4,
        "summary": "Track configuration, metrics, data/model awareness and reproducible artifacts.",
        "defaultProgress": "not-started",
        "whatIsThis": "Experiment tracking records model settings, metrics and artifacts so training runs can be compared and reproduced.",
        "why": "Once experiments multiply, memory and notebook filenames are not a reliable system of record.",
        "teaches": [
          "Experiment tracking records model settings, metrics and artifacts so training runs can be compared and reproduced."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Experiment tracking + artifacts evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Experiment tracking + artifacts to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Experiment tracking + artifacts.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Reproduce a selected model without reconstructing the experiment manually.",
        "ready": "",
        "resourceIds": [
          "R20"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "MLflow Experiment Tracking Lab",
          "goal": "Track hyperparameters, training metrics over epochs, and model artifacts with MLflow",
          "steps": [
            "Install MLflow and launch a local tracking server (mlflow ui)",
            "Wrap training code with mlflow.start_run(), logging parameters (learning_rate, max_depth, n_estimators)",
            "Log metrics at each epoch/iteration (loss, accuracy, validation score) using mlflow.log_metric()",
            "Log model artifacts, feature lists, and confusion matrix plots using mlflow.log_artifact()",
            "Register the best-performing model to the MLflow Model Registry with a version tag"
          ],
          "expectedResult": "A searchable, visual MLflow dashboard recording all experiment runs, parameters, and artifact versions.",
          "stretch": "Compare 5 different training runs side-by-side in MLflow UI to select the production candidate.",
          "completionCheck": "You can track experiments, log metrics/params, version model artifacts, and compare runs using MLflow."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Experiment tracking + artifacts to another engineer without reading code verbatim.",
        "completionCheck": "You can track experiments, log metrics/params, version model artifacts, and compare runs using MLflow."
      },
      {
        "id": "ml-pipelines",
        "name": "Training + data pipelines",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Turn notebook steps into validated, repeatable pipeline stages.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML pipelines turn data preparation and training steps into repeatable, validated stages.",
        "why": "Production models need a dependable path from raw data to a versioned artifact, not a fragile sequence of notebook cells.",
        "teaches": [
          "Modular pipeline design (loader, preprocessor, trainer, evaluator)",
          "Data validation and schema expectations at pipeline boundaries",
          "Data lineage and version tracking",
          "Batch vs streaming vs online feature pipelines",
          "Error handling, structured logging, and pipeline orchestration"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Training + data pipelines evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Training + data pipelines to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Training + data pipelines.",
        "prerequisites": [],
        "cover": [
          "Modular pipeline design (loader, preprocessor, trainer, evaluator)",
          "Data validation and schema expectations at pipeline boundaries",
          "Data lineage and version tracking",
          "Batch vs streaming vs online feature pipelines",
          "Error handling, structured logging, and pipeline orchestration"
        ],
        "skip": [],
        "proof": "A clean Python package with reproducible training and failure handling.",
        "ready": "",
        "resourceIds": [
          "R20"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Modular ML Training Pipeline Lab",
          "goal": "Refactor notebook code into modular, production-ready pipeline components with schema validation and lineage",
          "steps": [
            "Break ML code into distinct modules: data_loader.py, preprocessor.py, trainer.py, evaluator.py",
            "Add input/output data schema validation and lineage tracking at each pipeline boundary",
            "Implement structured logging (logging module) instead of print statements",
            "Handle exceptions and data errors gracefully with informative error messages",
            "Create an orchestrator script that executes the stages in sequence and generates a validation report"
          ],
          "expectedResult": "A clean Python package with repeatable training, error handling, schema validation, and separation of concerns.",
          "stretch": "Add automated unit tests covering the preprocessor and feature transformations.",
          "completionCheck": "You can turn notebook code into a clean, modular Python pipeline with validation and error handling."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Training + data pipelines to another engineer without reading code verbatim.",
        "completionCheck": "You can turn notebook code into a clean, modular Python pipeline with validation and error handling."
      },
      {
        "id": "model-serving",
        "name": "Model serving",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Expose appropriate batch or online inference with validation and clear boundaries.",
        "defaultProgress": "not-started",
        "whatIsThis": "Model serving gives applications a stable batch or online interface for requesting predictions.",
        "why": "Validation, versioning and failure behavior matter when other software depends on a model.",
        "teaches": [
          "Model serving gives applications a stable batch or online interface for requesting predictions."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Model serving evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Model serving to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Model serving.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "A tested inference interface with versioned model artifact and documented contract.",
        "ready": "",
        "resourceIds": [
          "R20",
          "R32"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "FastAPI Model Inference Service Lab",
          "goal": "Serve a trained ML model behind a validated, low-latency REST API with batch prediction",
          "steps": [
            "Load the trained model artifact into memory on FastAPI startup",
            "Define request and response schemas using Pydantic for single and batch predictions",
            "Implement input data preprocessing inside the API handler before passing to model.predict()",
            "Add health check (/health) and model metadata (/info) endpoints",
            "Measure P50, P95, and P99 inference latency under concurrent simulated requests"
          ],
          "expectedResult": "A responsive API that validates incoming requests, predicts in <50ms, and returns structured JSON.",
          "stretch": "Implement asynchronous batch inference for high-throughput workloads.",
          "completionCheck": "You can build and deploy a tested model serving API with input validation, health checks, and latency profiling."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Model serving to another engineer without reading code verbatim.",
        "completionCheck": "You can build and deploy a tested model serving API with input validation, health checks, and latency profiling."
      },
      {
        "id": "ml-deployment",
        "name": "ML deployment + CI/CD",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Containerize, automate checks and deploy using reasonable cloud primitives.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML deployment packages the model service, automates its checks and releases it into a real environment.",
        "why": "This connects modelling work to software that can be operated, updated and recovered safely.",
        "teaches": [
          "Package the service with Docker",
          "Automate tests and builds with GitHub Actions",
          "Deploy to a suitable environment",
          "Explain the cloud compute, networking, identity and monitoring underneath it"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens ML deployment + CI/CD evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply ML deployment + CI/CD to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require ML deployment + CI/CD.",
        "prerequisites": [
          "Docker",
          "Basic CI",
          "Cloud fundamentals"
        ],
        "cover": [
          "Package the service with Docker",
          "Automate tests and builds with GitHub Actions",
          "Deploy to a suitable environment",
          "Explain the cloud compute, networking, identity and monitoring underneath it"
        ],
        "skip": [],
        "proof": "Deployed Project 3 with automated tests, CI and a repeatable release path.",
        "ready": "",
        "resourceIds": [
          "R20",
          "R6",
          "R7",
          "R30"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Dockerized ML Deployment & CI/CD Lab",
          "goal": "Package the model service into a Docker container and automate deployment with GitHub Actions",
          "steps": [
            "Write a Dockerfile that copies the model artifact, dependencies, and FastAPI server",
            "Build and run the container locally, validating predictions against the containerized endpoint",
            "Write a GitHub Actions workflow that runs linting, unit tests, and builds the Docker image on PR",
            "Push the container image to a container registry (GitHub Packages / Docker Hub)",
            "Deploy the container to a cloud host (e.g. Render, Railway, or AWS EC2/ECS) and verify live DNS/HTTP access"
          ],
          "expectedResult": "A fully automated pipeline where committing code updates the running production model service.",
          "stretch": "Add a post-deployment health check step in GitHub Actions that rolls back if /health fails.",
          "completionCheck": "You can containerize, automate CI/CD checks, and deploy an ML service to a real host environment."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of ML deployment + CI/CD to another engineer without reading code verbatim.",
        "completionCheck": "You can containerize, automate CI/CD checks, and deploy an ML service to a real host environment."
      },
      {
        "id": "ml-monitoring",
        "name": "Model/system monitoring",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Make latency, errors, health and data/model quality visible.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML monitoring observes service health, latency, errors and changes in input or prediction quality.",
        "why": "A deployed model can become slow or inaccurate even when its code has not crashed.",
        "teaches": [
          "ML monitoring observes service health, latency, errors and changes in input or prediction quality."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Model/system monitoring evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Model/system monitoring to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Model/system monitoring.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Metrics, logs, drift awareness and an update/retraining strategy.",
        "ready": "",
        "resourceIds": [
          "R20",
          "R10"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Model Health & Data Drift Monitoring Lab",
          "goal": "Log prediction telemetry, monitor latency/errors, and detect data distribution drift",
          "steps": [
            "Add middleware to log every incoming inference request, response, latency, and status code to JSON logs",
            "Expose a /metrics endpoint with Prometheus counters for total requests, errors, and latency histograms",
            "Implement a data drift check (e.g. using Evidently or PSI calculation) comparing production inputs to training baseline",
            "Trigger an alert or warning when input distribution deviates significantly from training baseline",
            "Draft a written model retraining runbook describing when and how to update the model in production"
          ],
          "expectedResult": "Live telemetry and drift awareness that detects performance degradation before users report errors.",
          "stretch": "Visualize latency and request count metrics using a local Grafana dashboard.",
          "completionCheck": "You can observe service latency/errors, monitor input data drift, and establish a retraining strategy."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Model/system monitoring to another engineer without reading code verbatim.",
        "completionCheck": "You can observe service latency/errors, monitor input data drift, and establish a retraining strategy."
      }
    ]
  },
  {
    "id": "deep-learning",
    "order": 5,
    "name": "Deep Learning + PyTorch",
    "summary": "Build real training intuition and hands-on PyTorch evidence before claiming deep-learning competence.",
    "why": "Hosted embeddings and plug-and-play inference do not demonstrate model construction, training, evaluation or debugging.",
    "prerequisites": "Classical ML, linear algebra, probability, calculus/optimization and strong Python engineering.",
    "proof": "Project 4 — domain-flexible Deep Learning / Embeddings / Retrieval with genuine PyTorch work.",
    "unlocks": "Transformers, LLM fundamentals and model-aware AI systems.",
    "nodes": [
      {
        "id": "dl-mechanics",
        "name": "Neural-network mechanics",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Understand forward passes, backpropagation, initialization, losses and optimization.",
        "defaultProgress": "not-started",
        "whatIsThis": "Neural-network mechanics explain how layers produce outputs and how backpropagation changes weights to reduce error.",
        "why": "This intuition is necessary to diagnose training rather than treating a neural network as a black box.",
        "teaches": [
          "MLPs and backprop",
          "Activations and losses",
          "SGD/Adam",
          "Regularization and normalization"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Neural-network mechanics evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Neural-network mechanics to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Neural-network mechanics.",
        "prerequisites": [],
        "cover": [
          "MLPs and backprop",
          "Activations and losses",
          "SGD/Adam",
          "Regularization and normalization"
        ],
        "skip": [],
        "proof": "Implement and explain core mechanics, then diagnose training behavior.",
        "ready": "",
        "resourceIds": [
          "R21"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Micrograd: Autograd & Neural Network Mechanics Lab",
          "goal": "Build a tiny computational graph and autograd backpropagation engine from scratch in Python",
          "steps": [
            "Build a Value class that stores scalar data and pointers to children nodes",
            "Implement forward arithmetic operations (+, *, tanh, relu) with backward gradient closures",
            "Implement the topological sort and recursive .backward() method for reverse-mode automatic differentiation",
            "Build a 2-layer Multi-Layer Perceptron (Neuron, Layer, MLP) using the Value class",
            "Train the MLP on a small binary classification dataset (e.g. XOR) using manual gradient descent loops"
          ],
          "expectedResult": "The custom MLP successfully minimizes loss and classifies XOR data using your own autograd engine.",
          "stretch": "Add L2 regularization (weight decay) to the loss computation in your autograd engine.",
          "completionCheck": "You can explain forward passes, write autograd backprop math, and diagnose neural network training mechanics."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Neural-network mechanics to another engineer without reading code verbatim.",
        "completionCheck": "You can explain forward passes, write autograd backprop math, and diagnose neural network training mechanics."
      },
      {
        "id": "pytorch",
        "name": "PyTorch engineering",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "No current hands-on training artifact proves PyTorch competence.",
        "defaultProgress": "not-started",
        "whatIsThis": "PyTorch is a Python library for building, training, evaluating and debugging neural networks.",
        "why": "Hands-on model work proves more than calling a hosted model or a ready-made inference pipeline.",
        "teaches": [
          "Tensors and devices",
          "Dataset/DataLoader",
          "Modules, autograd and optimizers",
          "Training/eval loops",
          "Checkpointing and reproducibility"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens PyTorch engineering evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply PyTorch engineering to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require PyTorch engineering.",
        "prerequisites": [],
        "cover": [
          "Tensors and devices",
          "Dataset/DataLoader",
          "Modules, autograd and optimizers",
          "Training/eval loops",
          "Checkpointing and reproducibility"
        ],
        "skip": [],
        "proof": "Construct/adapt or meaningfully fine-tune a model in PyTorch, evaluate it, and debug training behavior.",
        "ready": "",
        "resourceIds": [
          "R22"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "PyTorch Model Construction & Training Loop Lab",
          "goal": "Construct, train, evaluate, and save a neural network in PyTorch using proper modular design",
          "steps": [
            "Create custom Dataset and DataLoader classes with batching, shuffling, and data transforms",
            "Define a custom neural network architecture by subclassing torch.nn.Module with forward() pass",
            "Implement the complete training loop: model.train(), optimizer.zero_grad(), loss.backward(), optimizer.step()",
            "Implement the evaluation loop: model.eval(), with torch.no_grad(), computing validation metrics",
            "Implement checkpoint saving and loading (torch.save / torch.load) with model state_dict and optimizer state"
          ],
          "expectedResult": "A robust PyTorch training script that tracks training/validation loss curves and saves best checkpoints.",
          "stretch": "Train the model on GPU/MPS device with device-agnostic code (torch.device(\"cuda\" if ... else \"mps\" if ... else \"cpu\")).",
          "completionCheck": "You can construct, train, evaluate, checkpoint, and debug a real PyTorch model on custom data."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of PyTorch engineering to another engineer without reading code verbatim.",
        "completionCheck": "You can construct, train, evaluate, checkpoint, and debug a real PyTorch model on custom data."
      },
      {
        "id": "dl-debugging",
        "name": "Training evaluation + debugging",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Diagnose exploding/vanishing gradients, overfit, underfit, learning rate, data bugs, imbalance and eval mode.",
        "defaultProgress": "not-started",
        "whatIsThis": "Deep-learning debugging uses data checks, learning curves and gradient behavior to explain failed or unstable training.",
        "why": "Neural models often fail silently through bad data, shapes, learning rates or evaluation mode.",
        "teaches": [
          "Deep-learning debugging uses data checks, learning curves and gradient behavior to explain failed or unstable training."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Training evaluation + debugging evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Training evaluation + debugging to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Training evaluation + debugging.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "A training journal with curves, failure analysis, fixes and quality/performance comparison.",
        "ready": "",
        "resourceIds": [
          "R21",
          "R22"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Deep Learning Training Diagnostics Lab",
          "goal": "Identify and fix exploding/vanishing gradients, overfit/underfit, bad learning rates, and eval mode bugs",
          "steps": [
            "Deliberately induce gradient explosion/vanishing by setting extreme weight initialization or learning rates",
            "Plot gradient norms across layers during training to detect vanishing gradients",
            "Add Gradient Clipping (torch.nn.utils.clip_grad_norm_) and Batch Normalization to stabilize training",
            "Test the \"overfit a single batch\" diagnostic technique: verify your model can reach 100% accuracy on 10 examples",
            "Diagnose an evaluation bug by comparing model output with model.eval() vs model.train() when using Dropout/BatchNorm"
          ],
          "expectedResult": "A documented training diagnostic journal showing before-and-after curves for each fixed issue.",
          "stretch": "Implement Learning Rate Scheduling (e.g. CosineAnnealingLR) and compare convergence.",
          "completionCheck": "You can diagnose and resolve exploding/vanishing gradients, overfit, learning rate issues, and eval mode bugs."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Training evaluation + debugging to another engineer without reading code verbatim.",
        "completionCheck": "You can diagnose and resolve exploding/vanishing gradients, overfit, learning rate issues, and eval mode bugs."
      },
      {
        "id": "embeddings-attention",
        "name": "Embeddings, attention + transformer intuition",
        "evidenceStatus": "missing",
        "weight": 4,
        "summary": "Connect learned representations to retrieval and transformer systems.",
        "defaultProgress": "not-started",
        "whatIsThis": "Embeddings represent items as learned vectors, while attention lets a model decide which information matters for each output.",
        "why": "These ideas connect deep learning to semantic retrieval and transformer-based systems.",
        "teaches": [
          "Embeddings and similarity",
          "Attention",
          "Transformer blocks",
          "CNN familiarity where useful"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Embeddings, attention + transformer intuition evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Embeddings, attention + transformer intuition to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Embeddings, attention + transformer intuition.",
        "prerequisites": [],
        "cover": [
          "Embeddings and similarity",
          "Attention",
          "Transformer blocks",
          "CNN familiarity where useful"
        ],
        "skip": [],
        "proof": "Compare a classical baseline, pretrained embedding baseline and PyTorch neural/fine-tuned approach.",
        "ready": "",
        "resourceIds": [
          "R21",
          "R22"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Embeddings & Multi-Head Self-Attention Lab",
          "goal": "Implement scaled dot-product self-attention and positional embeddings from scratch in PyTorch",
          "steps": [
            "Create an embedding layer (nn.Embedding) that maps token IDs to dense vector representations",
            "Implement sinusoidal positional encoding or learned positional embeddings to provide sequence position",
            "Implement Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V",
            "Implement causal masking (tril mask) to prevent attention from looking at future tokens",
            "Assemble a Multi-Head Attention block with projection layers and verify output tensor shapes"
          ],
          "expectedResult": "Multi-Head Attention block takes batch of token embeddings and returns context-aware representations.",
          "stretch": "Compare your custom self-attention output with torch.nn.MultiheadAttention to ensure numerical equivalence.",
          "completionCheck": "You can implement and explain embeddings, scaled dot-product attention, causal masking, and transformer blocks."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Embeddings, attention + transformer intuition to another engineer without reading code verbatim.",
        "completionCheck": "You can implement and explain embeddings, scaled dot-product attention, causal masking, and transformer blocks."
      },
      {
        "id": "cs336",
        "name": "Stanford CS336",
        "evidenceStatus": "locked",
        "weight": 2,
        "summary": "Advanced language-model depth; not mandatory for a first Applied AI role.",
        "defaultProgress": "not-started",
        "whatIsThis": "Stanford CS336 is an advanced course on constructing and training language models from scratch.",
        "why": "It is valuable only after strong software, math, ML, PyTorch and transformer prerequisites; using it earlier would displace higher-value foundations.",
        "teaches": [
          "Stanford CS336 is an advanced course on constructing and training language models from scratch."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Stanford CS336 evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Stanford CS336 to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Stanford CS336.",
        "prerequisites": [
          "SWE Core",
          "Math",
          "Classical ML",
          "PyTorch",
          "Transformer fundamentals"
        ],
        "cover": [],
        "skip": [
          "Do not put this next"
        ],
        "proof": "Optional advanced depth only after prerequisites are genuinely strong.",
        "ready": "",
        "resourceIds": [
          "R29"
        ],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Stanford CS336.",
        "completionCheck": "Optional advanced depth only after prerequisites are genuinely strong."
      }
    ]
  },
  {
    "id": "llm-fundamentals",
    "order": 6,
    "name": "LLM / Generative AI Fundamentals",
    "summary": "Convert local-model usage into engineering understanding of tokenization, transformers, inference and adaptation.",
    "why": "Using Qwen locally is valuable proof, but it is not the same as understanding or evaluating the underlying stack.",
    "prerequisites": "Deep-learning and transformer fundamentals, with local inference experience reused as evidence.",
    "proof": "A model-aware artifact explaining inference choices, quantization, context and evaluation.",
    "unlocks": "Retrieval, RAG, tools, agents and production AI systems.",
    "nodes": [
      {
        "id": "local-llm",
        "name": "Local LLM inference",
        "evidenceStatus": "already-proven",
        "weight": 3,
        "summary": "Local Qwen 4B/8B execution and Apple-Silicon memory/performance work are already documented.",
        "defaultProgress": "completed",
        "whatIsThis": "Local LLM inference means running an existing language model on your own hardware instead of only calling a hosted API.",
        "why": "Current projects already prove this useful deployment skill; the roadmap now builds the missing model and evaluation understanding around it.",
        "teaches": [
          "Local LLM inference means running an existing language model on your own hardware instead of only calling a hosted API."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Local LLM inference evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Local LLM inference to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Local LLM inference.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Existing local-model applications and performance experiments.",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [
          "Resume: local Qwen systems",
          "Local AI applications"
        ],
        "handsOnLab": {
          "title": "Local Model Inference & Quantization Lab",
          "goal": "Run local open-source LLMs (Qwen/Llama) on Apple Silicon / local hardware with memory and latency profiling",
          "steps": [
            "Load a quantized model (e.g. 4-bit / 8-bit GGUF via llama.cpp or Ollama / MLX)",
            "Measure RAM/VRAM usage, time-to-first-token (TTFT), and tokens-per-second generation speed",
            "Implement structured output generation (JSON mode) using schema constraints or grammars",
            "Benchmark generation quality and memory footprint across different quantization levels (Q4_K_M vs Q8_0 vs FP16)",
            "Document performance trade-offs and hardware constraints for local vs cloud API hosting"
          ],
          "expectedResult": "A working local inference system with measured memory, latency, and reliable structured outputs.",
          "stretch": "Implement prompt caching to reduce time-to-first-token on multi-turn conversations.",
          "completionCheck": "You can run local LLMs, profile memory/latency trade-offs, and generate reliable structured outputs."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Local LLM inference to another engineer without reading code verbatim.",
        "completionCheck": "You can run local LLMs, profile memory/latency trade-offs, and generate reliable structured outputs."
      },
      {
        "id": "transformers",
        "name": "Transformer + tokenization fundamentals",
        "evidenceStatus": "partial",
        "weight": 5,
        "summary": "Conceptual exposure exists; systematic engineering understanding needs proof.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Transformers are neural-network architectures that use attention to process sequences such as text.",
        "why": "Understanding tokens, attention and context explains how LLM inputs, outputs, memory and limitations fit together.",
        "teaches": [
          "Tokenization",
          "Embeddings and attention",
          "Pretraining vs post-training",
          "Context length and KV cache"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Transformer + tokenization fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Transformer + tokenization fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Transformer + tokenization fundamentals.",
        "prerequisites": [],
        "cover": [
          "Tokenization",
          "Embeddings and attention",
          "Pretraining vs post-training",
          "Context length and KV cache"
        ],
        "skip": [],
        "proof": "Explain the model/data flow and major memory/performance implications.",
        "ready": "",
        "resourceIds": [
          "R23"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Transformer Tokenization & KV Cache Lab",
          "goal": "Build a Byte-Pair Encoding (BPE) tokenizer and trace KV cache memory scaling in LLMs",
          "steps": [
            "Train a simple BPE tokenizer on sample text and inspect the resulting vocabulary and merge rules",
            "Encode text to token IDs and decode back, verifying lossless round-trip reconstruction",
            "Trace the tensor dimensions through a transformer forward pass (Batch, Seq_Len, D_Model, Num_Heads, Head_Dim)",
            "Implement a simple Key-Value (KV) cache for autoregressive generation and observe token generation speedup",
            "Calculate the KV cache memory formula: 2 * num_layers * num_heads * head_dim * seq_len * precision_bytes"
          ],
          "expectedResult": "Clear mathematical and code understanding of tokenization, attention tensors, and KV cache memory costs.",
          "stretch": "Simulate context length scaling from 2K to 32K tokens and plot KV cache memory requirements.",
          "completionCheck": "You can explain tokenization, attention mechanisms, pretraining vs fine-tuning, and KV cache scaling."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Transformer + tokenization fundamentals to another engineer without reading code verbatim.",
        "completionCheck": "You can explain tokenization, attention mechanisms, pretraining vs fine-tuning, and KV cache scaling."
      },
      {
        "id": "llm-inference",
        "name": "Inference + quantization",
        "evidenceStatus": "partial",
        "weight": 4,
        "summary": "Local execution is proven; deepen model size/memory, quantization, sampling and structured output reasoning.",
        "defaultProgress": "in-progress",
        "whatIsThis": "LLM inference is the process of loading a trained model and generating outputs under memory, speed and quality constraints.",
        "why": "Model size, quantization and sampling choices determine whether a system is practical and reliable.",
        "teaches": [
          "Open vs hosted models",
          "Quantization trade-offs",
          "Temperature and generation",
          "Structured outputs",
          "Model selection"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Inference + quantization evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Inference + quantization to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Inference + quantization.",
        "prerequisites": [],
        "cover": [
          "Open vs hosted models",
          "Quantization trade-offs",
          "Temperature and generation",
          "Structured outputs",
          "Model selection"
        ],
        "skip": [],
        "proof": "Benchmark and explain when a smaller local model is enough.",
        "ready": "",
        "resourceIds": [
          "R23"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "LLM Sampling, Temperature & Context Scaling Lab",
          "goal": "Implement sampling strategies (greedy, top-k, top-p, temperature) and benchmark context limits",
          "steps": [
            "Implement logit sampling functions: Greedy search, Temperature scaling, Top-K filtering, Top-P (nucleus) sampling",
            "Test how Temperature (0.0 vs 0.7 vs 1.5) affects output determinism, creativity, and hallucination rate",
            "Implement system prompts and conversation history truncation strategies (sliding window vs summary buffer)",
            "Measure degradation in model recall as context length increases (\"Lost in the Middle\" phenomenon)",
            "Implement structured Pydantic response parsing with automated retry on JSON parse failure"
          ],
          "expectedResult": "A robust generation harness with configurable sampling parameters and validated structured responses.",
          "stretch": "Implement speculative decoding with a small draft model and large target model to accelerate inference.",
          "completionCheck": "You can configure sampling parameters, manage context windows, and enforce structured JSON outputs."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Inference + quantization to another engineer without reading code verbatim.",
        "completionCheck": "You can configure sampling parameters, manage context windows, and enforce structured JSON outputs."
      },
      {
        "id": "sft-lora",
        "name": "SFT / LoRA concepts",
        "evidenceStatus": "not-needed-yet",
        "weight": 3,
        "summary": "Learn adaptation concepts, but fine-tune only when a real problem and evaluation justify it.",
        "defaultProgress": "not-started",
        "whatIsThis": "Supervised fine-tuning and LoRA adapt an existing model using task-specific examples.",
        "why": "Adaptation should happen only when a measured problem cannot be solved well enough through prompting, retrieval or model selection.",
        "teaches": [
          "Supervised fine-tuning and LoRA adapt an existing model using task-specific examples."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens SFT / LoRA concepts evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply SFT / LoRA concepts to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require SFT / LoRA concepts.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "A reasoned adaptation decision or a meaningful small fine-tuning experiment.",
        "ready": "",
        "resourceIds": [
          "R23"
        ],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of SFT / LoRA concepts.",
        "completionCheck": "A reasoned adaptation decision or a meaningful small fine-tuning experiment."
      },
      {
        "id": "llm-evaluation-foundation",
        "name": "Model evaluation fundamentals",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Current local-LLM work lacks systematic evaluation evidence.",
        "defaultProgress": "not-started",
        "whatIsThis": "LLM evaluation uses representative prompts and measurements to judge answer quality, speed and resource use.",
        "why": "Without an evaluation set, model or prompt choices are driven by anecdotes.",
        "teaches": [
          "LLM evaluation uses representative prompts and measurements to judge answer quality, speed and resource use."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Model evaluation fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Model evaluation fundamentals to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Model evaluation fundamentals.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "A representative evaluation set with quality, latency and resource measurements.",
        "ready": "",
        "resourceIds": [
          "R23"
        ],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Model evaluation fundamentals.",
        "completionCheck": "A representative evaluation set with quality, latency and resource measurements."
      }
    ]
  },
  {
    "id": "ai-systems",
    "order": 7,
    "name": "LLM / AI Systems",
    "summary": "Build retrieval, evaluation, tool and agent systems from durable abstractions instead of framework fashions.",
    "why": "Applied AI requires context construction, measurement, tool boundaries and reliable system behavior.",
    "prerequisites": "LLM fundamentals plus growing Professional SWE Depth.",
    "proof": "An evaluated end-to-end AI system with explicit baselines and known failure modes.",
    "unlocks": "Production AI Engineering and the Project 5 specialization experiment.",
    "nodes": [
      {
        "id": "retrieval-rag",
        "name": "Retrieval + RAG",
        "evidenceStatus": "partial",
        "weight": 5,
        "summary": "Prototype exposure is plausible; parsing, hybrid retrieval, reranking and retrieval evaluation need strong evidence.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Retrieval-augmented generation finds relevant source material and supplies it to a model before it answers.",
        "why": "The system must retrieve the right evidence and measure failures; adding a vector database alone does not prove that.",
        "teaches": [
          "Corpus and parsing",
          "Lexical/vector/hybrid retrieval",
          "Metadata and reranking",
          "Context selection",
          "Retrieval and answer evaluation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Retrieval + RAG evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Retrieval + RAG to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Retrieval + RAG.",
        "prerequisites": [],
        "cover": [
          "Corpus and parsing",
          "Lexical/vector/hybrid retrieval",
          "Metadata and reranking",
          "Context selection",
          "Retrieval and answer evaluation"
        ],
        "skip": [
          "Learning a framework before the system model"
        ],
        "proof": "Compare meaningful retrieval baselines on a representative dataset.",
        "ready": "",
        "resourceIds": [
          "R24"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Production Hybrid RAG & Vector Retrieval Lab",
          "goal": "Build and evaluate a hybrid retrieval system combining BM25 keyword search and dense vector embeddings",
          "steps": [
            "Parse and chunk a document corpus using semantic/recursive character chunking with overlap",
            "Generate dense vector embeddings and store in a vector index",
            "Build a BM25 sparse lexical index over the same chunked corpus",
            "Implement Reciprocal Rank Fusion (RRF) to combine lexical and dense retrieval rankings",
            "Apply a Cross-Encoder Reranker model (e.g. bge-reranker) to re-score the top 20 candidate chunks",
            "Evaluate retrieval hit rate and Mean Reciprocal Rank (MRR) on a test set of 20 realistic queries"
          ],
          "expectedResult": "Hybrid retrieval with reranking achieves higher recall and precision than naive vector search alone.",
          "stretch": "Measure latency and accuracy trade-offs before and after adding the cross-encoder reranker.",
          "completionCheck": "You can build and evaluate hybrid retrieval (lexical + dense) with chunking, reranking, and retrieval metrics."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Retrieval + RAG to another engineer without reading code verbatim.",
        "completionCheck": "You can build and evaluate hybrid retrieval (lexical + dense) with chunking, reranking, and retrieval metrics."
      },
      {
        "id": "agents",
        "name": "Tools + agents",
        "evidenceStatus": "partial",
        "weight": 4,
        "summary": "Routing/escalation and task-executing prototypes are meaningful; evaluation and operational boundaries need depth.",
        "defaultProgress": "in-progress",
        "whatIsThis": "An AI agent is a model-driven loop that chooses actions, uses tools, observes results and continues toward a task.",
        "why": "Tool access creates useful automation but also new failure paths, so success, trajectories and permissions must be measured.",
        "teaches": [
          "Agent loop",
          "Actions and observations",
          "Tool contracts",
          "Agentic RAG",
          "Trajectory evaluation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Tools + agents evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Tools + agents to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Tools + agents.",
        "prerequisites": [],
        "cover": [
          "Agent loop",
          "Actions and observations",
          "Tool contracts",
          "Agentic RAG",
          "Trajectory evaluation"
        ],
        "skip": [
          "Mastering every framework"
        ],
        "proof": "An agent whose task success, trajectories and failure modes are measured.",
        "ready": "",
        "resourceIds": [
          "R25"
        ],
        "evidenceBasis": [
          "Resume: agent routing/escalation prototypes"
        ],
        "handsOnLab": {
          "title": "Tool-Calling ReAct Agent Loop Lab",
          "goal": "Implement a model-driven ReAct (Reason + Act) loop with structured tool execution and observation parsing",
          "steps": [
            "Define a tool registry with typed JSON schemas (e.g. search_db, calculate, execute_query)",
            "Implement the agent loop: Prompt with available tools → Parse tool call → Execute tool safely → Append observation → Repeat",
            "Implement loop termination conditions: Max iterations, task completion detection, and error budget",
            "Add tool execution sandboxing and input validation to prevent arbitrary code or command execution",
            "Evaluate agent trajectory on 5 multi-step tasks, recording success rate, step count, and tool errors"
          ],
          "expectedResult": "A reliable autonomous agent loop that calls tools, handles observation errors, and reaches goals.",
          "stretch": "Implement human-in-the-loop approval before executing sensitive tool actions (e.g. delete/modify).",
          "completionCheck": "You can build an agent loop with typed tool contracts, error handling, and trajectory evaluation."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Tools + agents to another engineer without reading code verbatim.",
        "completionCheck": "You can build an agent loop with typed tool contracts, error handling, and trajectory evaluation."
      },
      {
        "id": "mcp",
        "name": "MCP",
        "evidenceStatus": "not-needed-yet",
        "weight": 2,
        "summary": "A later integration mechanism, not a foundational technology.",
        "defaultProgress": "not-started",
        "whatIsThis": "Model Context Protocol is a standard way for AI hosts to connect to tools, data resources and external services.",
        "why": "MCP is an integration protocol—not an AI foundation—and belongs only where a real system benefits from a reusable interface.",
        "teaches": [
          "Host/client/server",
          "Tools and resources",
          "Authorization and security"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens MCP evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply MCP to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require MCP.",
        "prerequisites": [],
        "cover": [
          "Host/client/server",
          "Tools and resources",
          "Authorization and security"
        ],
        "skip": [
          "Toy servers presented as flagship proof"
        ],
        "proof": "A useful MCP interface only where it improves a real system.",
        "ready": "",
        "resourceIds": [
          "R26"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Model Context Protocol (MCP) Server & Client Lab",
          "goal": "Implement a standard Model Context Protocol (MCP) server exposing tools and data resources",
          "steps": [
            "Build an MCP server using the official MCP SDK exposing at least 2 tools (e.g. query_system, fetch_logs)",
            "Define JSON-RPC schemas for tool arguments and return structures",
            "Implement secure input validation and authentication on the MCP server",
            "Connect an MCP client host (e.g. Claude Desktop or custom client) to your MCP server",
            "Verify tool discovery, invocation, and response exchange over standard MCP transport (stdio/SSE)"
          ],
          "expectedResult": "A compliant MCP server that seamlessly exposes capabilities to any MCP-compatible AI host.",
          "stretch": "Implement dynamic MCP resource streaming for large dataset inspection.",
          "completionCheck": "You can design, build, and secure an MCP server/client interface exposing tools and data resources."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of MCP to another engineer without reading code verbatim.",
        "completionCheck": "You can design, build, and secure an MCP server/client interface exposing tools and data resources."
      },
      {
        "id": "context-engineering",
        "name": "Context engineering",
        "evidenceStatus": "partial",
        "weight": 4,
        "summary": "Repository/context efficiency is a promising hypothesis; validate it through measurable work.",
        "defaultProgress": "in-progress",
        "whatIsThis": "Context engineering selects the instructions, retrieved information and tool results that a model sees for a task.",
        "why": "Context is limited and noisy; better selection can improve accuracy while reducing tokens, latency and distraction.",
        "teaches": [
          "Finite context as a resource",
          "Just-in-time retrieval",
          "Context selection",
          "Harness and tool strategies"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Context engineering evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Context engineering to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Context engineering.",
        "prerequisites": [],
        "cover": [
          "Finite context as a resource",
          "Just-in-time retrieval",
          "Context selection",
          "Harness and tool strategies"
        ],
        "skip": [],
        "proof": "A measured improvement in task accuracy, relevance, latency or token efficiency.",
        "ready": "",
        "resourceIds": [
          "R27"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Context Optimization & Token Efficiency Lab",
          "goal": "Engineer structured context prompts that maximize task accuracy while minimizing token cost and latency",
          "steps": [
            "Benchmark a naive \"dump everything\" prompt vs a curated \"just-in-time\" retrieved context prompt",
            "Implement context pruning: strip unnecessary whitespace, comments, and irrelevant metadata from documents",
            "Structure context using clear semantic XML tags (<document>, <instructions>, <tools>, <examples>)",
            "Measure token count reduction and latency savings across 20 test inputs",
            "Verify that pruned context maintains or improves downstream task accuracy against the naive baseline"
          ],
          "expectedResult": "Measurable 40%+ token reduction and faster response times with zero loss in task accuracy.",
          "stretch": "Implement dynamic few-shot example selection based on semantic similarity to the incoming prompt.",
          "completionCheck": "You can structure, filter, and optimize prompt context to improve accuracy and token efficiency."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Context engineering to another engineer without reading code verbatim.",
        "completionCheck": "You can structure, filter, and optimize prompt context to improve accuracy and token efficiency."
      },
      {
        "id": "llm-evals",
        "name": "LLM + agent evaluation",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "A critical missing competency for reliable multi-turn, tool-using systems.",
        "defaultProgress": "not-started",
        "whatIsThis": "LLM and agent evaluation tests complete system behavior across retrieval, generation, tools and multi-step trajectories.",
        "why": "Production changes need a regression suite that reveals whether later prompts, models or tools made outcomes worse.",
        "teaches": [
          "Reference datasets",
          "Deterministic tests",
          "Retrieval metrics",
          "Human/model judging with caveats",
          "Regression suites",
          "Failure taxonomy",
          "Cost and latency",
          "Trajectory evaluation"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens LLM + agent evaluation evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply LLM + agent evaluation to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require LLM + agent evaluation.",
        "prerequisites": [],
        "cover": [
          "Reference datasets",
          "Deterministic tests",
          "Retrieval metrics",
          "Human/model judging with caveats",
          "Regression suites",
          "Failure taxonomy",
          "Cost and latency",
          "Trajectory evaluation"
        ],
        "skip": [],
        "proof": "Known failure modes, representative evals, measurements and demonstrated improvement.",
        "ready": "",
        "resourceIds": [
          "R24",
          "R25"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "LLM Regression Suite & Evaluation Harness Lab",
          "goal": "Build an automated evaluation dataset and regression test suite for LLM and RAG outputs",
          "steps": [
            "Assemble an evaluation dataset of 25+ representative input queries with ground-truth reference outputs",
            "Implement deterministic assertions: regex matches, JSON schema validity, required key presence, and forbidden terms",
            "Implement semantic evaluation metrics: BLEU/ROUGE, cosine similarity against ground truth, and LLM-as-a-judge with rubrics",
            "Run the evaluation suite against baseline system and record benchmark scores (accuracy, latency, cost)",
            "Make a prompt or model change, re-run the evaluation suite, and verify that regressions are immediately identified"
          ],
          "expectedResult": "An automated CI-style test suite that prevents silent quality degradation on model or prompt updates.",
          "stretch": "Implement G-Eval style pairwise comparison with calibrated scoring criteria.",
          "completionCheck": "You can build evaluation datasets, automated regression test suites, and measure system accuracy and failure rates."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of LLM + agent evaluation to another engineer without reading code verbatim.",
        "completionCheck": "You can build evaluation datasets, automated regression test suites, and measure system accuracy and failure rates."
      }
    ]
  },
  {
    "id": "production-ai",
    "order": 8,
    "name": "Production AI Engineering",
    "summary": "Make model behavior, retrieval, tools, reliability, observability, latency, cost and security one production problem.",
    "why": "This is what distinguishes an AI engineer from someone who built an API-wrapper chatbot.",
    "prerequisites": "AI Systems plus deepening cloud, system design, observability, security and operational reliability.",
    "proof": "A controlled deployment with traces, failure analysis, regression evals, permissions and measurable iteration.",
    "unlocks": "Applied AI, AI Platform and AI Infrastructure readiness.",
    "nodes": [
      {
        "id": "ai-observability",
        "name": "AI observability + traces",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Inspect system/model behavior across retrieval, generation and tool calls.",
        "defaultProgress": "not-started",
        "whatIsThis": "AI observability uses traces, logs and metrics to show what happened across retrieval, model calls and tools.",
        "why": "When an answer fails, engineers need to locate the failing component instead of blaming the whole model.",
        "teaches": [
          "AI observability uses traces, logs and metrics to show what happened across retrieval, model calls and tools."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens AI observability + traces evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply AI observability + traces to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require AI observability + traces.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Traces make failures attributable and actionable.",
        "ready": "",
        "resourceIds": [
          "R24",
          "R10"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "AI Trace & Latency Attribution Lab",
          "goal": "Instrument an LLM/RAG pipeline with distributed tracing to attribute latency, costs, and failures",
          "steps": [
            "Instrument the RAG/Agent pipeline with OpenTelemetry or Langfuse/Arize tracing",
            "Trace every step of a request: User Query → Retrieval (latency) → Model Call (tokens + latency) → Tool Execution",
            "Log prompt inputs, raw completions, token counts, and cost estimates per request with a correlation ID",
            "Simulate a slow database query or model rate limit and locate the bottleneck in the trace waterfall",
            "Set up an alert threshold for requests exceeding latency budgets or failing with unhandled exceptions"
          ],
          "expectedResult": "Full visibility into multi-step AI execution with exact time and cost breakdowns per component.",
          "stretch": "Tag traces with user feedback (thumbs up/down) to connect operational traces with user satisfaction.",
          "completionCheck": "You can trace requests across retrieval, model calls, and tools to identify bottlenecks and failure causes."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of AI observability + traces to another engineer without reading code verbatim.",
        "completionCheck": "You can trace requests across retrieval, model calls, and tools to identify bottlenecks and failure causes."
      },
      {
        "id": "ai-reliability",
        "name": "Reliability + fallbacks",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Handle timeouts, retries, provider failure, rate limits, caching and graceful degradation.",
        "defaultProgress": "not-started",
        "whatIsThis": "AI reliability keeps the system useful when providers are slow, tools fail, limits are reached or outputs are unsafe.",
        "why": "Timeouts, retries, fallbacks and graceful degradation keep expected failures from becoming uncontrolled incidents.",
        "teaches": [
          "AI reliability keeps the system useful when providers are slow, tools fail, limits are reached or outputs are unsafe."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Reliability + fallbacks evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Reliability + fallbacks to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Reliability + fallbacks.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Failure injection or incident scenarios demonstrate bounded, observable behavior.",
        "ready": "",
        "resourceIds": [
          "R10"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Resilience, Retries & Fallback Strategy Lab",
          "goal": "Implement circuit breakers, exponential backoff, model fallbacks, and caching for AI services",
          "steps": [
            "Implement exponential backoff with jitter for handling HTTP 429 (Rate Limit) and 503 errors",
            "Implement a secondary model fallback: if primary model times out or errors, automatically failover to backup model",
            "Implement semantic caching for repeated queries to return cached responses with 0 model cost and <10ms latency",
            "Implement graceful degradation: return partial answers or heuristic responses when downstream APIs fail completely",
            "Test resilience by injecting synthetic network delays and provider errors (chaos testing)"
          ],
          "expectedResult": "The service maintains availability and returns bounded responses even during complete provider outages.",
          "stretch": "Implement an adaptive rate limiter that dynamically throttles requests before hitting provider rate limits.",
          "completionCheck": "You can implement timeouts, retries, fallbacks, caching, and graceful degradation for resilient AI systems."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Reliability + fallbacks to another engineer without reading code verbatim.",
        "completionCheck": "You can implement timeouts, retries, fallbacks, caching, and graceful degradation for resilient AI systems."
      },
      {
        "id": "ai-security",
        "name": "AI security + permissions",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Agent access increases blast radius; permissions and data boundaries must be explicit.",
        "defaultProgress": "not-started",
        "whatIsThis": "AI security protects data and actions from prompt injection, unsafe outputs, excessive permissions and compromised sources.",
        "why": "Tool-using systems can affect real data and services, so their blast radius must be deliberately limited.",
        "teaches": [
          "Prompt injection",
          "Sensitive data",
          "Insecure output handling",
          "Excessive agency",
          "Tool permissions",
          "Retrieval/data risks",
          "Credential handling"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens AI security + permissions evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply AI security + permissions to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require AI security + permissions.",
        "prerequisites": [],
        "cover": [
          "Prompt injection",
          "Sensitive data",
          "Insecure output handling",
          "Excessive agency",
          "Tool permissions",
          "Retrieval/data risks",
          "Credential handling"
        ],
        "skip": [],
        "proof": "Threat model, least-privilege tools and tested security controls.",
        "ready": "",
        "resourceIds": [
          "R28"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "AI Threat Modeling & Injection Defense Lab",
          "goal": "Threat-model an AI system and implement defenses against prompt injection and tool privilege escalation",
          "steps": [
            "Construct a threat model identifying attack vectors: direct prompt injection, indirect injection via data, data exfiltration",
            "Implement input sanitization and delimiters separating system instructions from untrusted user/document inputs",
            "Implement tool permission scoping: ensure read-only tools cannot perform state-modifying actions",
            "Test attack payloads (jailbreaks, instruction overrides, delimiter escaping) and verify defenses block them",
            "Implement output validation to prevent the model from executing dangerous shell commands or exposing API keys"
          ],
          "expectedResult": "A defended system that safely isolates user inputs and restricts tool actions to least-privilege boundaries.",
          "stretch": "Implement an automated security regression test that runs known injection payloads on every build.",
          "completionCheck": "You can threat-model an AI application, enforce tool permissions, and defend against prompt injection."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of AI security + permissions to another engineer without reading code verbatim.",
        "completionCheck": "You can threat-model an AI application, enforce tool permissions, and defend against prompt injection."
      },
      {
        "id": "ai-economics",
        "name": "Latency + cost engineering",
        "evidenceStatus": "missing",
        "weight": 4,
        "summary": "Measure model, retrieval and orchestration trade-offs instead of guessing.",
        "defaultProgress": "not-started",
        "whatIsThis": "Latency and cost engineering measures how long a system takes and what compute, memory and tokens it consumes.",
        "why": "Production choices should come from real benchmarks, because a small quality gain may create unacceptable delay or cost.",
        "teaches": [
          "Response time and throughput",
          "Model size and memory",
          "Input/output tokens",
          "Compute or provider cost",
          "Quality-versus-cost comparisons on real project traffic"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Latency + cost engineering evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Latency + cost engineering to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Latency + cost engineering.",
        "prerequisites": [],
        "cover": [
          "Response time and throughput",
          "Model size and memory",
          "Input/output tokens",
          "Compute or provider cost",
          "Quality-versus-cost comparisons on real project traffic"
        ],
        "skip": [
          "A certificate or separate course without real measurements"
        ],
        "proof": "Benchmarks compare quality, tokens, latency, memory and cost where applicable.",
        "ready": "",
        "resourceIds": [
          "R24",
          "R30"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Latency, Cost & Token Economics Lab",
          "goal": "Profile, benchmark, and optimize token usage, model tiering, and dollar costs across application traffic",
          "steps": [
            "Calculate unit economics: cost per 1,000 requests across different model tiers (e.g. flagship vs small model)",
            "Implement model tiering: route simple classification queries to a fast/cheap model and complex reasoning to a larger model",
            "Benchmark response streaming (SSE) to reduce perceived user latency (Time-to-First-Token < 500ms)",
            "Measure monthly projected costs under 10k, 100k, and 1M monthly active requests",
            "Document trade-offs: quality delta vs cost multiplier when upgrading or downgrading models"
          ],
          "expectedResult": "A documented economic model and routing system that reduces production cost by 60%+ without sacrificing quality.",
          "stretch": "Implement prompt compression or token caching to minimize input token billing on repetitive prompts.",
          "completionCheck": "You can measure latency, throughput, token consumption, and model costs to optimize production trade-offs."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Latency + cost engineering to another engineer without reading code verbatim.",
        "completionCheck": "You can measure latency, throughput, token consumption, and model costs to optimize production trade-offs."
      },
      {
        "id": "feedback-loops",
        "name": "Feedback loops + regression evaluation",
        "evidenceStatus": "missing",
        "weight": 5,
        "summary": "Every prompt, model or context change should pass a representative evaluation loop.",
        "defaultProgress": "not-started",
        "whatIsThis": "A feedback loop turns production failures and user outcomes into test cases for the next system change.",
        "why": "Prompts, models and retrieved context change frequently; regression evaluation prevents quiet quality loss.",
        "teaches": [
          "Turn real failures into evaluation cases",
          "Run offline regression checks before release",
          "Trace controlled production behavior",
          "Compare the new system with the previous baseline"
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Feedback loops + regression evaluation evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Feedback loops + regression evaluation to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Feedback loops + regression evaluation.",
        "prerequisites": [],
        "cover": [
          "Turn real failures into evaluation cases",
          "Run offline regression checks before release",
          "Trace controlled production behavior",
          "Compare the new system with the previous baseline"
        ],
        "skip": [],
        "proof": "Offline eval → controlled deployment → traces → failure analysis → regression suite → re-evaluation.",
        "ready": "",
        "resourceIds": [
          "R24"
        ],
        "evidenceBasis": [],
        "handsOnLab": {
          "title": "Production Incident to Regression Eval Loop Lab",
          "goal": "Turn production edge-case failures into permanent evaluation test cases and verify system improvements",
          "steps": [
            "Capture a real or simulated production failure (e.g. model hallucination, bad retrieval chunk, tool failure)",
            "Analyze root cause: Was it retrieval deficiency, ambiguous prompt, model limitation, or bad tool output?",
            "Add the failing query and expected correct behavior to the versioned evaluation dataset",
            "Implement a targeted fix (e.g. prompt constraint, reranker adjustment, or tool validation)",
            "Re-run the entire evaluation suite to prove the failure is fixed AND no other test cases regressed"
          ],
          "expectedResult": "A closed-loop engineering workflow where every production failure permanently strengthens the system.",
          "stretch": "Automate the ingestion of negative user feedback into candidate eval cases.",
          "completionCheck": "You can turn production failures into regression eval cases and prove improvements without quality regressions."
        },
        "explainIt": "Explain the core concepts, failure modes, and architectural trade-offs of Feedback loops + regression evaluation to another engineer without reading code verbatim.",
        "completionCheck": "You can turn production failures into regression eval cases and prove improvements without quality regressions."
      }
    ]
  },
  {
    "id": "specialization",
    "order": 9,
    "name": "Specialization",
    "summary": "Select depth only after technical signal, personal interest and market evidence align.",
    "why": "The current best hypothesis is AI Developer Infrastructure + Context / Repository Intelligence, but it must earn that status.",
    "prerequisites": "Strong cross-stage evidence and a serious Project 5 benchmark.",
    "proof": "Project 5 — ATLAS Context Engine / Repository Intelligence.",
    "unlocks": "A defensible identity across Applied AI, platform, inference or developer infrastructure roles.",
    "nodes": [
      {
        "id": "applied-ai-branch",
        "name": "Applied AI / Agent Systems",
        "evidenceStatus": "optional",
        "weight": 3,
        "summary": "Broad alignment with current direction.",
        "defaultProgress": "not-started",
        "whatIsThis": "Applied AI engineering builds user-facing systems around models, retrieval, tools and evaluation.",
        "why": "Choose this branch if reliable end-to-end AI behavior proves more compelling than deeper platform or research work.",
        "teaches": [
          "Applied AI engineering builds user-facing systems around models, retrieval, tools and evaluation."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Applied AI / Agent Systems evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Applied AI / Agent Systems to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Applied AI / Agent Systems.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Applied AI / Agent Systems.",
        "completionCheck": "You can demonstrate this capability independently in a real project."
      },
      {
        "id": "dev-infra-branch",
        "name": "AI Developer Infrastructure + Context",
        "evidenceStatus": "partial",
        "weight": 5,
        "summary": "Current most distinctive specialization hypothesis.",
        "defaultProgress": "in-progress",
        "whatIsThis": "AI developer infrastructure builds tools that help models or engineers understand repositories and complete software tasks.",
        "why": "This is the current specialization hypothesis, but Project 5 must prove a measurable advantage before it becomes an identity.",
        "teaches": [
          "AI developer infrastructure builds tools that help models or engineers understand repositories and complete software tasks."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens AI Developer Infrastructure + Context evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply AI Developer Infrastructure + Context to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require AI Developer Infrastructure + Context.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "Project 5 must improve task success, context relevance, efficiency or reliability against baselines.",
        "ready": "",
        "resourceIds": [
          "R27"
        ],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of AI Developer Infrastructure + Context.",
        "completionCheck": "Project 5 must improve task success, context relevance, efficiency or reliability against baselines."
      },
      {
        "id": "ml-platform-branch",
        "name": "ML Platform / MLOps",
        "evidenceStatus": "optional",
        "weight": 3,
        "summary": "Choose if production infrastructure and reliability prove most compelling.",
        "defaultProgress": "not-started",
        "whatIsThis": "ML platform work builds shared training, deployment, monitoring and reliability systems for model teams.",
        "why": "Choose it if operating reusable ML infrastructure becomes the strongest technical and market signal.",
        "teaches": [
          "ML platform work builds shared training, deployment, monitoring and reliability systems for model teams."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens ML Platform / MLOps evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply ML Platform / MLOps to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require ML Platform / MLOps.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of ML Platform / MLOps.",
        "completionCheck": "You can demonstrate this capability independently in a real project."
      },
      {
        "id": "inference-branch",
        "name": "Inference / Performance / Local AI",
        "evidenceStatus": "optional",
        "weight": 3,
        "summary": "A credible branch given Apple-Silicon and local-model work.",
        "defaultProgress": "not-started",
        "whatIsThis": "Inference engineering makes trained models run efficiently on real hardware and serving environments.",
        "why": "Local-model and performance work makes this credible, but deeper specialization should follow demonstrated interest and need.",
        "teaches": [
          "Inference engineering makes trained models run efficiently on real hardware and serving environments."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Inference / Performance / Local AI evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Inference / Performance / Local AI to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Inference / Performance / Local AI.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Inference / Performance / Local AI.",
        "completionCheck": "You can demonstrate this capability independently in a real project."
      },
      {
        "id": "classical-specialist-branch",
        "name": "Classical ML specialization",
        "evidenceStatus": "optional",
        "weight": 2,
        "summary": "Ranking, recommendation, forecasting or experimentation if interest grows.",
        "defaultProgress": "not-started",
        "whatIsThis": "A classical ML specialization goes deeper into areas such as ranking, recommendation, forecasting or experimentation.",
        "why": "It remains valuable when the problem and data favor rigorous statistical or tree-based methods over neural systems.",
        "teaches": [
          "A classical ML specialization goes deeper into areas such as ranking, recommendation, forecasting or experimentation."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Classical ML specialization evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Classical ML specialization to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Classical ML specialization.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Classical ML specialization.",
        "completionCheck": "You can demonstrate this capability independently in a real project."
      },
      {
        "id": "research-branch",
        "name": "Research / Foundation Models",
        "evidenceStatus": "not-needed-yet",
        "weight": 2,
        "summary": "Later only if mathematical depth and research interest justify it.",
        "defaultProgress": "not-started",
        "whatIsThis": "Foundation-model research studies or creates new model, training and evaluation methods.",
        "why": "This path requires stronger mathematics, experiments and research motivation than the current applied-engineering roadmap.",
        "teaches": [
          "Foundation-model research studies or creates new model, training and evaluation methods."
        ],
        "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
        "careerConnection": "It strengthens Research / Foundation Models evidence inside a serious project and makes related role claims easier to inspect.",
        "miniExercise": "",
        "projectApplication": "Apply Research / Foundation Models to the active project instead of creating a disconnected tutorial repository.",
        "unlocks": "Stronger evidence for the next dependency and the roles that require Research / Foundation Models.",
        "prerequisites": [],
        "cover": [],
        "skip": [],
        "proof": "",
        "ready": "",
        "resourceIds": [],
        "evidenceBasis": [],
        "handsOnLab": null,
        "explainIt": "Explain the mechanics and practical trade-offs of Research / Foundation Models.",
        "completionCheck": "You can demonstrate this capability independently in a real project."
      }
    ]
  }
];

  const sweDepth = {
  "name": "Professional Software Engineering Depth",
  "kind": "parallel-depth",
  "summary": "A permanent horizontal track that continues through Math, ML, Deep Learning, LLM Systems and Production AI.",
  "tags": [
    "Deployment",
    "Cloud",
    "System design",
    "Backend / database depth",
    "Security",
    "Observability",
    "Reliability",
    "Performance",
    "Concurrency",
    "Operational maturity"
  ],
  "nodes": [
    {
      "id": "production-deployment",
      "name": "Production deployment",
      "evidenceStatus": "partial",
      "weight": 4,
      "summary": "Vercel deployment exists; container/backend operations need depth.",
      "defaultProgress": "in-progress",
      "whatIsThis": "Production deployment releases software into an environment where real users or systems can depend on it.",
      "why": "Repeatable packaging, automated checks, configuration and rollback turn a local project into operable software.",
      "teaches": [
        "Package the application with Docker",
        "Automate checks and release gates",
        "Deploy to a real environment",
        "Document configuration, rollback and operations",
        "Connect the deployment to cloud compute, networking and monitoring"
      ],
      "whyNow": "This is parallel depth after Core packaging and CI—not the first item in the current queue.",
      "careerConnection": "Repeatable releases and rollback evidence make a repository look operated, not merely demonstrated.",
      "miniExercise": "",
      "projectApplication": "Deploy the containerized Project 1 service to one real environment and record a successful release and rollback rehearsal.",
      "unlocks": "Cloud operations, observability and ML deployment depth.",
      "prerequisites": [],
      "cover": [
        "Package the application with Docker",
        "Automate checks and release gates",
        "Deploy to a real environment",
        "Document configuration, rollback and operations",
        "Connect the deployment to cloud compute, networking and monitoring"
      ],
      "skip": [],
      "proof": "Repeatable staging/production deployment with documented rollback and operations.",
      "ready": "",
      "resourceIds": [
        "R6",
        "R7",
        "R30"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "Production Staging Deployment & Runbook Lab",
        "goal": "Deploy a containerized application to a cloud host with environment secrets, health checks, and rollback plan",
        "steps": [
          "Configure environment variables and secrets using a secrets manager or cloud environment settings (never committed to git)",
          "Deploy the containerized service to a cloud provider (e.g. Render, AWS App Runner, Fly.io, or DigitalOcean)",
          "Configure automated health check monitoring (/health) and restart policies on failure",
          "Write a one-page Operational Runbook detailing: deployment steps, log inspection, restart procedures, and rollback command",
          "Simulate a failed deployment and execute a clean rollback to the previous working version in under 2 minutes"
        ],
        "expectedResult": "A live, publicly accessible, secure service with a verified operational rollback procedure.",
        "stretch": "Set up custom domain with automated TLS/HTTPS certificate renewal.",
        "completionCheck": "You can deploy a containerized service with secrets, health checks, monitoring, and documented rollback."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Production deployment.",
      "completionCheck": "You can deploy a containerized service with secrets, health checks, monitoring, and documented rollback."
    },
    {
      "id": "system-design",
      "name": "System Design Fundamentals",
      "evidenceStatus": "partial",
      "weight": 4,
      "summary": "Begin from real application architecture; Docker is not a prerequisite.",
      "defaultProgress": "in-progress",
      "whatIsThis": "System design explains how the major parts of an application—services, databases, caches, queues and clients—fit together.",
      "why": "As systems grow, engineers must reason about data flow, failures, bottlenecks and scaling instead of assuming one server will always work.",
      "teaches": [
        "Requirements and boundaries",
        "Request/data flow",
        "Caching and queues",
        "Scaling and availability",
        "Failures, bottlenecks and observability",
        "Alternatives and trade-offs"
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens System Design Fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply System Design Fundamentals to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require System Design Fundamentals.",
      "prerequisites": [
        "Backend fundamentals",
        "HTTP / API fundamentals",
        "Relational DB fundamentals",
        "Some real project experience"
      ],
      "cover": [
        "Requirements and boundaries",
        "Request/data flow",
        "Caching and queues",
        "Scaling and availability",
        "Failures, bottlenecks and observability",
        "Alternatives and trade-offs"
      ],
      "skip": [
        "Senior interview drills",
        "Designing hyperscale systems for theater"
      ],
      "proof": "Architecture document for a real system: requirements, components, flow, data, boundaries, failure points, bottlenecks, observability, scaling and trade-offs.",
      "ready": "",
      "resourceIds": [
        "R31"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "System Architecture Design & Bottleneck Lab",
        "goal": "Design an end-to-end distributed system architecture document analyzing data flow, bottlenecks, and trade-offs",
        "steps": [
          "Define functional and non-functional requirements (throughput, latency targets, availability, data durability)",
          "Draw an architectural block diagram showing clients, API gateway, services, database, cache, and message queue",
          "Trace read and write data flows through the system, calculating expected QPS and storage growth per year",
          "Identify single points of failure (SPOF) and performance bottlenecks under 10x traffic spike",
          "Justify architectural trade-offs: SQL vs NoSQL, Synchronous REST vs Asynchronous Queues, Strong vs Eventual Consistency"
        ],
        "expectedResult": "A comprehensive, professional System Architecture Document suitable for engineering review.",
        "stretch": "Calculate capacity estimates (memory, bandwidth, storage) for 10 million daily active users.",
        "completionCheck": "You can design system architectures, trace data flow, analyze bottlenecks, and justify scaling trade-offs."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of System Design Fundamentals.",
      "completionCheck": "You can design system architectures, trace data flow, analyze bottlenecks, and justify scaling trade-offs."
    },
    {
      "id": "cloud-fundamentals",
      "name": "Cloud Fundamentals",
      "evidenceStatus": "missing",
      "weight": 4,
      "summary": "Learn after Docker fundamentals and basic deployment; it does not block Classical ML.",
      "defaultProgress": "not-started",
      "whatIsThis": "Cloud fundamentals explain rented compute, storage, networking, databases, identity and monitoring used to run software online.",
      "why": "After Docker and basic deployment, these concepts help you choose and operate infrastructure without memorizing a provider catalogue.",
      "teaches": [
        "Compute, storage and networking",
        "Managed databases",
        "IAM and secrets",
        "Logs and monitoring",
        "Scaling, regions and cost"
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Cloud Fundamentals evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Cloud Fundamentals to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Cloud Fundamentals.",
      "prerequisites": [
        "SWE Core mostly established",
        "HTTP/APIs",
        "Databases",
        "Docker fundamentals",
        "Basic deployment",
        "Linux/CLI"
      ],
      "cover": [
        "Compute, storage and networking",
        "Managed databases",
        "IAM and secrets",
        "Logs and monitoring",
        "Scaling, regions and cost"
      ],
      "skip": [
        "Certification memorization",
        "Hundreds of service names"
      ],
      "proof": "Deploy a serious Dockerized service, document networking/IAM/secrets/monitoring/cost, and justify VM vs container vs serverless.",
      "ready": "",
      "resourceIds": [
        "R30"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "Cloud Infrastructure & IAM Primitives Lab",
        "goal": "Map application requirements to cloud compute, managed database, IAM permissions, and storage",
        "steps": [
          "Map application stack to core cloud primitives: Compute (VM/Container), Storage (S3/Blob), Database (Managed Postgres), Network (VPC/Security Groups)",
          "Configure least-privilege IAM roles and access policies ensuring services only access necessary resources",
          "Store application assets/artifacts in object storage with signed URLs for secure access",
          "Configure structured cloud logging to aggregate application and system logs",
          "Calculate monthly cloud billing estimates and set up budget threshold alerts"
        ],
        "expectedResult": "A clear cloud architecture with secure IAM boundaries, managed database, and budget alerts.",
        "stretch": "Write an Infrastructure-as-Code (Terraform or CloudFormation) snippet defining a storage bucket and IAM role.",
        "completionCheck": "You can configure and reason about cloud compute, managed storage, IAM permissions, networking, and costs."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Cloud Fundamentals.",
      "completionCheck": "You can configure and reason about cloud compute, managed storage, IAM permissions, networking, and costs."
    },
    {
      "id": "backend-db-depth",
      "name": "Backend + database depth",
      "evidenceStatus": "partial",
      "weight": 4,
      "summary": "Deepen migrations, transaction boundaries, indexing, query optimization and service logic.",
      "defaultProgress": "in-progress",
      "whatIsThis": "Backend and database depth covers the harder decisions behind service boundaries, transactions, migrations, queries and data integrity.",
      "why": "Real systems become safer and faster when application logic and database behavior are designed together.",
      "teaches": [
        "Service and API boundaries",
        "Validation, errors and authorization",
        "Database schemas and migrations",
        "Transaction boundaries and constraints",
        "Indexes, query plans and performance",
        "Architecture trade-offs as the service grows"
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Backend + database depth evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Backend + database depth to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Backend + database depth.",
      "prerequisites": [],
      "cover": [
        "Service and API boundaries",
        "Validation, errors and authorization",
        "Database schemas and migrations",
        "Transaction boundaries and constraints",
        "Indexes, query plans and performance",
        "Architecture trade-offs as the service grows"
      ],
      "skip": [],
      "proof": "Real Project 1 engineering decisions justified by requirements.",
      "ready": "",
      "resourceIds": [
        "R3",
        "R32",
        "R31"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "Advanced Database Transactions & Migration Lab",
        "goal": "Implement database transactions with isolation levels, connection pooling, and zero-downtime migrations",
        "steps": [
          "Implement ACID transaction blocks with appropriate isolation levels (Read Committed vs Serializable)",
          "Configure connection pooling (e.g. asyncpg, SQLAlchemy pool, or PgBouncer) and benchmark under 100 concurrent connections",
          "Write database migration scripts using Alembic or raw SQL with forward (upgrade) and backward (downgrade) steps",
          "Simulate a migration on a live database ensuring no table locks block read/write traffic",
          "Diagnose and resolve a simulated database deadlock between two concurrent transactions"
        ],
        "expectedResult": "Safe database operations with connection pooling, robust transactions, and reversible migrations.",
        "stretch": "Implement soft deletes with filtered unique indexes for data retention compliance.",
        "completionCheck": "You can implement transactions with isolation levels, connection pooling, and safe database migrations."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Backend + database depth.",
      "completionCheck": "You can implement transactions with isolation levels, connection pooling, and safe database migrations."
    },
    {
      "id": "observability-reliability",
      "name": "Observability + reliability",
      "evidenceStatus": "partial",
      "weight": 5,
      "summary": "AIMonitor is relevant early evidence; application logs, metrics, traces and SLO reasoning need depth.",
      "defaultProgress": "in-progress",
      "whatIsThis": "Observability makes a system’s health visible; reliability engineering uses that information to keep service behavior within useful targets.",
      "why": "Deployed software needs clear answers to “is it healthy, slow or failing?” before incidents can be controlled.",
      "teaches": [
        "Observability makes a system’s health visible; reliability engineering uses that information to keep service behavior within useful targets."
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Observability + reliability evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Observability + reliability to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Observability + reliability.",
      "prerequisites": [],
      "cover": [],
      "skip": [],
      "proof": "Answer: Is it healthy, slow or failing? What failed, how often and what changed?",
      "ready": "",
      "resourceIds": [
        "R10"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "SRE Service Level Objectives & Alerting Lab",
        "goal": "Define Service Level Indicators (SLIs), Service Level Objectives (SLOs), and actionable alerting rules",
        "steps": [
          "Define 3 core SLIs for your service: Availability (% 2xx/3xx), Latency (P95 < 200ms), Error Rate (% 5xx < 0.1%)",
          "Establish reasonable 30-day SLO targets and calculate the Error Budget",
          "Configure structured application logging with trace IDs and context parameters",
          "Set up multi-window alert rules that trigger only when error budget consumption rate indicates real incident",
          "Write an Incident Post-Mortem template documenting timeline, root cause, impact, and preventive actions"
        ],
        "expectedResult": "Actionable monitoring that alerts on real user impact while avoiding alert fatigue.",
        "stretch": "Implement distributed tracing spans across database queries and external HTTP calls.",
        "completionCheck": "You can define SLIs/SLOs, configure error-budget alerting, and structure incident post-mortems."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Observability + reliability.",
      "completionCheck": "You can define SLIs/SLOs, configure error-budget alerting, and structure incident post-mortems."
    },
    {
      "id": "software-security",
      "name": "Application security",
      "evidenceStatus": "partial",
      "weight": 4,
      "summary": "Deliberate OWASP-level coverage and a threat model are not yet strongly demonstrated.",
      "defaultProgress": "in-progress",
      "whatIsThis": "Application security identifies how users, inputs, dependencies and configuration could expose data or unauthorized actions.",
      "why": "Security must be applied to a real architecture because memorizing vulnerability names does not reduce risk.",
      "teaches": [
        "Application security identifies how users, inputs, dependencies and configuration could expose data or unauthorized actions."
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Application security evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Application security to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Application security.",
      "prerequisites": [],
      "cover": [],
      "skip": [],
      "proof": "Threat model and fixed vulnerabilities for one serious project.",
      "ready": "",
      "resourceIds": [
        "R9"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "OWASP Security Audit & Threat Model Lab",
        "goal": "Perform an OWASP Top 10 security audit, threat-model application surfaces, and patch vulnerabilities",
        "steps": [
          "Conduct a STRIDE threat model across user authentication, API endpoints, and database queries",
          "Audit code for SQL injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF)",
          "Implement password hashing using Argon2 or bcrypt with secure salt work factors",
          "Enforce strict CORS policies and security headers (Content-Security-Policy, HSTS, X-Content-Type-Options)",
          "Run an automated dependency vulnerability scanner (e.g. pip-audit, npm audit) and patch outdated packages"
        ],
        "expectedResult": "A documented security audit and hardened codebase with zero known high/critical vulnerabilities.",
        "stretch": "Implement rate limiting and brute-force protection on authentication endpoints.",
        "completionCheck": "You can threat-model applications, audit for OWASP vulnerabilities, and implement security controls."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Application security.",
      "completionCheck": "You can threat-model applications, audit for OWASP vulnerabilities, and implement security controls."
    },
    {
      "id": "performance-concurrency",
      "name": "Performance + concurrency",
      "evidenceStatus": "partial",
      "weight": 4,
      "summary": "Local-LLM memory tuning is useful evidence; broaden profiling, async/background work and race/failure reasoning.",
      "defaultProgress": "in-progress",
      "whatIsThis": "Performance work finds bottlenecks; concurrency work reasons about multiple tasks sharing time, memory and data.",
      "why": "Slow services and race conditions require measurement and systems understanding, not premature optimization.",
      "teaches": [
        "Performance work finds bottlenecks; concurrency work reasons about multiple tasks sharing time, memory and data."
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Performance + concurrency evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Performance + concurrency to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Performance + concurrency.",
      "prerequisites": [],
      "cover": [],
      "skip": [],
      "proof": "Profile a real bottleneck and document a justified improvement.",
      "ready": "",
      "resourceIds": [
        "R1",
        "R8"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "Profiling & Async Concurrency Lab",
        "goal": "Profile CPU/memory bottlenecks and implement asynchronous background worker tasks",
        "steps": [
          "Profile application execution using cProfile or py-spy to identify CPU hotspots and slow functions",
          "Profile memory allocation using memory_profiler or tracemalloc to detect memory leaks and large objects",
          "Refactor synchronous blocking I/O calls into async/await coroutines using asyncio",
          "Implement a background task queue (e.g. Celery, ARQ, or FastAPI BackgroundTasks) for long-running jobs",
          "Measure throughput (requests/sec) before and after async concurrency under load"
        ],
        "expectedResult": "Measurable 3x+ throughput improvement and elimination of blocking I/O bottlenecks.",
        "stretch": "Implement concurrency control with asyncio.Semaphore to prevent overwhelming downstream services.",
        "completionCheck": "You can profile CPU/memory bottlenecks, eliminate blocking I/O, and implement async concurrency."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Performance + concurrency.",
      "completionCheck": "You can profile CPU/memory bottlenecks, eliminate blocking I/O, and implement async concurrency."
    },
    {
      "id": "operational-maturity",
      "name": "Operational maturity",
      "evidenceStatus": "missing",
      "weight": 5,
      "summary": "Practice failure recovery, maintenance, release safety and incident learning.",
      "defaultProgress": "not-started",
      "whatIsThis": "Operational maturity is the practice of releasing, maintaining, recovering and learning from software in real use.",
      "why": "Safe operations turn failures into bounded incidents and lasting improvements instead of repeated surprises.",
      "teaches": [
        "Operational maturity is the practice of releasing, maintaining, recovering and learning from software in real use."
      ],
      "whyNow": "This capability belongs here because it strengthens the evidence required by the current dependency sequence before later work can be trusted.",
      "careerConnection": "It strengthens Operational maturity evidence inside a serious project and makes related role claims easier to inspect.",
      "miniExercise": "",
      "projectApplication": "Apply Operational maturity to the active project instead of creating a disconnected tutorial repository.",
      "unlocks": "Stronger evidence for the next dependency and the roles that require Operational maturity.",
      "prerequisites": [],
      "cover": [],
      "skip": [],
      "proof": "A realistic incident/regression write-up with corrective and preventive actions.",
      "ready": "",
      "resourceIds": [
        "R10"
      ],
      "evidenceBasis": [],
      "handsOnLab": {
        "title": "Incident Response & Post-Mortem Lab",
        "goal": "Conduct a simulated production incident response, mitigation, and blameless post-mortem writeup",
        "steps": [
          "Simulate a production incident (e.g. service outage, memory leak crash, or data corruption bug)",
          "Execute incident triage: detect issue via logs/metrics, identify blast radius, and apply mitigation (rollback/restart)",
          "Perform root cause analysis (5 Whys technique) to find systemic underlying causes",
          "Write a Blameless Post-Mortem document: Incident Summary, Timeline, Impact, Root Cause, What Went Well, Action Items",
          "Convert action items into trackable GitHub issues (preventive checks, automated tests, improved alerts)"
        ],
        "expectedResult": "A complete, professional Post-Mortem writeup and implementation of preventive safeguards.",
        "stretch": "Implement an automated regression test that reproduces the incident failure to prevent recurrence.",
        "completionCheck": "You can lead incident triage, write blameless post-mortems, and implement lasting preventive controls."
      },
      "explainIt": "Explain the architectural trade-offs, operational failure modes, and security considerations of Operational maturity.",
      "completionCheck": "You can lead incident triage, write blameless post-mortems, and implement lasting preventive controls."
    }
  ]
};

  const orientationVideos = [
  {
    "id": "V1",
    "nodeIds": [
      "testing"
    ],
    "title": "What is automated testing? Beginner intro & automation demo",
    "creator": "Testopic",
    "url": "https://www.youtube.com/watch?v=pQPUs9uaKUM",
    "duration": "15 min",
    "why": "Builds a plain-language mental model of manual versus automated testing, unit/integration/E2E tests and the test pyramid before pytest syntax.",
    "understandAfter": "Why tests exist, what different test levels protect and why a useful suite is not the same as 100% coverage.",
    "lastVerified": "13 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "V2",
    "nodeIds": [
      "docker"
    ],
    "title": "Docker Crash Course for Absolute Beginners",
    "creator": "TechWorld with Nana",
    "url": "https://www.youtube.com/watch?v=pg19Z8LL06w",
    "duration": "1 hr 7 min",
    "why": "Explains images, containers, registries, ports and Dockerfiles with a beginner-friendly end-to-end example.",
    "understandAfter": "The image/container distinction, what Docker packages and how a service moves from a Dockerfile to a running container.",
    "lastVerified": "13 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "V3",
    "nodeIds": [
      "basic-ci"
    ],
    "title": "How to use GitHub Actions | GitHub for Beginners",
    "creator": "GitHub",
    "url": "https://www.youtube.com/watch?v=BQrohJ3PT7I",
    "duration": "7 min 26 sec",
    "why": "Official, compact orientation to workflows, triggers, jobs and running an automated check.",
    "understandAfter": "What starts a workflow, where its YAML lives and how a repository action becomes an automatic check.",
    "lastVerified": "13 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "V4",
    "nodeIds": [
      "relational-db"
    ],
    "title": "PostgreSQL Introduction — Beginner Crash Course",
    "creator": "Caleb Curry",
    "url": "https://www.youtube.com/watch?v=bssWKAX74uA",
    "duration": "16 min",
    "why": "Gives a short visual introduction to PostgreSQL before the official documentation is used for targeted engineering depth.",
    "understandAfter": "What PostgreSQL is, how relational tables are queried and where the database fits in a backend system.",
    "lastVerified": "13 Aug 2026",
    "status": "VERIFIED"
  },
  {
    "id": "V5",
    "nodeIds": [
      "backend"
    ],
    "title": "Build a Simple API from Scratch — FastAPI Tutorial for Beginners",
    "creator": "Python Simplified",
    "url": "https://www.youtube.com/watch?v=dglcDIUTSsY",
    "duration": "22 min",
    "why": "Turns API and FastAPI vocabulary into one small working service before the official tutorial is used as reference.",
    "understandAfter": "How endpoints receive parameters, return responses, handle errors and run through an API server.",
    "lastVerified": "13 Aug 2026",
    "status": "VERIFIED"
  }
];

  const taskResourceContext = {
  "testing": {
    "R4": {
      "role": "PRIMARY — learn and implement now",
      "why": "pytest is the main implementation guide for the current Testing mission.",
      "selected": "Getting started, assertions, fixtures, parametrization and useful failure output.",
      "repeat": "Return when a fixture, isolation or test-organization problem appears.",
      "stop": "Stop when Project 1 has meaningful unit and integration coverage that catches a real regression."
    },
    "R5": {
      "role": "CONDITIONAL REFERENCE",
      "why": "Use only if the selected Project 1 backend is FastAPI.",
      "selected": "TestClient setup, successful responses, validation failures and dependency behavior.",
      "repeat": "Return when an endpoint or dependency override needs a focused example.",
      "stop": "Stop when the critical API path and important failure behavior are protected."
    }
  },
  "docker": {
    "R6": {
      "role": "PRIMARY — learn and implement next",
      "why": "Docker Get Started supports the exact packaging work required after Testing.",
      "selected": "Images, containers, Dockerfiles, ports, volumes, Compose and container logs.",
      "repeat": "Return when the real service exposes a networking, persistence or build problem.",
      "stop": "Stop when another engineer can clone the repository and start the relevant services from documented commands."
    }
  },
  "basic-ci": {
    "R7": {
      "role": "PRIMARY — implement after tests",
      "why": "GitHub Actions turns the existing test and build commands into visible pull-request gates.",
      "selected": "Workflow syntax, events, jobs, steps, dependency caching and secrets only if required.",
      "repeat": "Return when adding one justified check or release step.",
      "stop": "Stop when a pull request shows meaningful failed and successful checks."
    }
  },
  "backend": {
    "R32": {
      "role": "SELECTED REFERENCE",
      "why": "Use it to close the actual FastAPI structure, validation or dependency gap—not as a full framework course.",
      "selected": "Request validation, errors, dependencies, SQL integration, larger applications and tests.",
      "repeat": "Return only when Project 1 exposes one of these backend questions.",
      "stop": "Stop when the service boundary and critical request path are clear, validated and tested."
    }
  },
  "relational-db": {
    "R3": {
      "role": "SELECTED DEPTH READING",
      "why": "The official PostgreSQL material supports schema, transaction and query decisions inside the real backend.",
      "selected": "Tables, joins, constraints, transactions, indexes, EXPLAIN and migrations.",
      "repeat": "Return when a concrete query, integrity or migration decision appears.",
      "stop": "Stop when the selected schema and query decisions can be justified with evidence."
    }
  },
  "production-deployment": {
    "R6": {
      "role": "PREREQUISITE REFERENCE",
      "why": "Reuse Docker knowledge to package the deployable artifact; do not restart the whole resource.",
      "selected": "Production Dockerfile, configuration, health check and build output.",
      "repeat": "Return when the deployment image fails to build or start.",
      "stop": "Stop when the same tested image starts locally and in the target environment."
    },
    "R7": {
      "role": "RELEASE AUTOMATION REFERENCE",
      "why": "Extend the existing CI workflow only after its checks are trustworthy.",
      "selected": "Protected checks, environment secrets and one deliberate deploy step if justified.",
      "repeat": "Return when the release gate changes.",
      "stop": "Stop when releases are repeatable and a failed check blocks deployment."
    },
    "R30": {
      "role": "SELECTED CLOUD CONTEXT",
      "why": "Use durable cloud concepts to explain where the container runs and how it is operated.",
      "selected": "Compute, networking, IAM, secrets, logs, monitoring and basic cost.",
      "repeat": "Return when an infrastructure choice needs justification.",
      "stop": "Stop when the deployment runbook explains these choices without certification study."
    }
  },
  "system-design": {
    "R31": {
      "role": "SELECTED ARCHITECTURE REFERENCE",
      "why": "Use the primer to name trade-offs visible in a system you already understand.",
      "selected": "Requirements, service boundaries, data flow, stores, caching, failures and scaling.",
      "repeat": "Return when the architecture gains a real bottleneck or new component.",
      "stop": "Stop when the Project 1 architecture document explains present trade-offs and one reasonable evolution."
    }
  },
  "cloud-fundamentals": {
    "R30": {
      "role": "PRIMARY CONCEPT REFERENCE",
      "why": "Cloud terms now map to an already containerized and deployed service.",
      "selected": "Compute, storage, networking, managed databases, IAM, monitoring, regions and cost.",
      "repeat": "Return when Project 1 uses a new infrastructure category.",
      "stop": "Stop when the deployment can be explained across each selected category."
    }
  }
};

  const glossary = [
  {
    "term": "CI",
    "definition": "Continuous Integration: automatically run checks such as tests, linters, and builds whenever code changes are pushed."
  },
  {
    "term": "CI/CD",
    "definition": "Continuous Integration and Continuous Delivery/Deployment: automatically check changes and deploy safe releases to users."
  },
  {
    "term": "Deployment",
    "definition": "Putting a tested version of software into an environment (staging or production) where users or systems can run it."
  },
  {
    "term": "Container",
    "definition": "An isolated running process created from an image that packages an application and its required runtime environment."
  },
  {
    "term": "SRE",
    "definition": "Site Reliability Engineering: applying software and operational practices (SLIs, SLOs, error budgets) to keep services dependable."
  },
  {
    "term": "Observability",
    "definition": "The ability to understand a system’s internal behavior and health from external telemetry: logs, metrics, and traces."
  },
  {
    "term": "Logs",
    "definition": "Timestamped records of events, errors, and actions that occurred while software was running."
  },
  {
    "term": "Metrics",
    "definition": "Numeric measurements collected over time, such as CPU utilization, error rate, memory use, or request latency."
  },
  {
    "term": "Tracing",
    "definition": "Following one individual request or task across multiple services and functions to locate bottlenecks and attribute failures."
  },
  {
    "term": "MLOps",
    "definition": "Practices for tracking experiments, packaging, deploying, monitoring, and updating machine learning models safely."
  },
  {
    "term": "Inference",
    "definition": "Using a trained model to produce predictions or generated text from input data."
  },
  {
    "term": "Embedding",
    "definition": "A learned numeric vector that represents an item (word, sentence, image) so semantic relationships and similarity can be calculated."
  },
  {
    "term": "RAG",
    "definition": "Retrieval-Augmented Generation: finding relevant source passages from a database and injecting them into model context before answering."
  },
  {
    "term": "Reranking",
    "definition": "Reordering retrieved candidate documents with a secondary cross-encoder model so the highest-relevance evidence appears first."
  },
  {
    "term": "IAM",
    "definition": "Identity and Access Management: security framework determining which users or services can access which resources and actions."
  },
  {
    "term": "Latency",
    "definition": "The duration of time an individual request or operation takes to complete from start to finish."
  },
  {
    "term": "Throughput",
    "definition": "The rate of successful operations, records, or requests processed per unit of time (e.g. requests per second)."
  },
  {
    "term": "P99 Latency",
    "definition": "99th percentile response time: 99% of requests complete faster than this duration, measuring tail-end worst-case performance."
  },
  {
    "term": "Idempotency",
    "definition": "A property of an operation where executing it multiple times produces the exact same outcome without duplicate side effects."
  },
  {
    "term": "CAP Theorem",
    "definition": "Distributed systems trade-off: a distributed data store can guarantee at most two of Consistency, Availability, and Partition Tolerance."
  },
  {
    "term": "MCP",
    "definition": "Model Context Protocol: an open standard interface for connecting AI models to external tools, databases, and prompt resources."
  },
  {
    "term": "Agent",
    "definition": "A model-driven loop that autonomously selects actions, invokes tools, observes environment responses, and iterates to complete a goal."
  },
  {
    "term": "Vector Database",
    "definition": "A specialized index optimized for storing vector embeddings and computing nearest-neighbor semantic search (e.g. cosine distance)."
  },
  {
    "term": "Regression Evaluation",
    "definition": "An automated test suite of known input/output pairs that verifies whether a code, prompt, or model change broke existing functionality."
  }
];

  const projects = [
  {
    "id": "project-1",
    "name": "Production Engineering Upgrade of the Best Existing Project",
    "status": "in-progress",
    "preferredCandidate": "Pawnstone Vault — subject to architecture fit after inspecting the real repository.",
    "optionalGreenfield": "ReSource Relay is an OPTIONAL INDEPENDENT GREENFIELD IDEA — NOT PROJECT 1. Project 1 must be an upgrade of an existing project.",
    "purpose": "Upgrade an authentic existing application so it demonstrates professional software-engineering depth and ownership. Do not create another CRUD app solely for ATLAS.",
    "direction": "Current preferred candidate: Pawnstone Vault — subject to architecture fit after inspecting the real repository.",
    "recommendedBuild": "Harden Pawnstone Vault or selected backend with pytest suites, Docker multi-stage build, GitHub Actions CI, PostgreSQL ACID transactions, and structured logging.",
    "whyThisProblem": "Proves you can operate, test, and improve production software rather than only writing toy scripts.",
    "whoItHelps": "Real users requiring reliable application state and secure backend services.",
    "mvp": "Containerized service with 80%+ test coverage on core business logic, automated CI gate, and deployed staging instance.",
    "technicalChallenges": [
      "Handling concurrent requests and database connection pooling safely",
      "Preventing regressions with deterministic unit and integration tests",
      "Setting up zero-leakage secret management in CI/CD and deployment environments"
    ],
    "whatItDemonstrates": "Software engineering discipline, testing ownership, containerization, and operations.",
    "advancedFeatures": "Rate limiting middleware, database migration rollback scripts, and structured OpenTelemetry tracing.",
    "whatNotToOverbuild": "Do not bolt on microservices, Kubernetes, or Kafka before the single service is well-tested and operated.",
    "mustProve": [
      "Real frontend/backend/API/database surface",
      "Meaningful architecture and engineering ownership",
      "Tests: unit, integration and critical-path E2E",
      "CI, deployment, logging and observability",
      "Security, performance and maintainability",
      "Schema, migrations, constraints, transactions and indexes where justified"
    ],
    "guardrails": [
      "Keep Pawnstone if its existing architecture exposes authentic depth.",
      "Add services only for real responsibilities such as long-running work, integration orchestration or document/batch processing.",
      "If managed services hide too much, inspect the ATLAS FastAPI Assistant, then another existing backend project.",
      "Never bolt on FastAPI, queues or microservices for appearance."
    ],
    "resourceIds": [
      "R32",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7"
    ],
    "proof": "A reviewer can inspect tests, architecture, operational decisions, incidents and deployment—not merely features.",
    "completionCheck": "You have upgraded an authentic project with unit/integration tests, Docker packaging, CI automated checks, and documented deployment."
  },
  {
    "id": "project-2",
    "name": "Domain-Flexible Applied Classical ML Project",
    "status": "not-started",
    "domainBadge": "Domain-Flexible Example: CivicPulse",
    "recommendedExample": "CivicPulse — Automated civic issue classification, priority triage, and resolution-time forecasting using public municipal open data.",
    "purpose": "Prove the complete classical ML problem-solving process rather than familiarity with scikit-learn calls.",
    "direction": "Choose the domain by learning value, dataset quality, genuine interest, target clarity, evaluation quality, portfolio value and usable data—not by ATLAS forcing finance or developer tooling.",
    "recommendedBuild": "End-to-end scikit-learn / XGBoost pipeline comparing linear vs tree baselines, with strict temporal train/val/test splits, leakage audit, error slice analysis, and reproducible config.",
    "whyThisProblem": "Real municipal civic data has noisy text, imbalanced categories, and temporal shifts—perfect for proving rigorous data cleaning and leakage prevention.",
    "whoItHelps": "City municipal dispatchers and citizens tracking resolution times and routing urgency.",
    "mvp": "Reproducible experiment comparing Logistic Regression vs Random Forest vs LightGBM with F1-macro evaluation and SHAP error analysis.",
    "technicalChallenges": [
      "Preventing temporal data leakage across service request timestamps",
      "Handling severe class imbalance in rare high-urgency emergency categories",
      "Evaluating model calibration for predicted resolution times"
    ],
    "whatItDemonstrates": "End-to-end ML problem framing, data validation, leakage-safe splitting, model comparison, and error analysis.",
    "advancedFeatures": "Automated data validation assertions, threshold calibration for high-cost errors, and slice-based subgroup fairness metrics.",
    "whatNotToOverbuild": "Do not jump to deep learning or complex neural networks when classical tree ensembles achieve superior tabular performance.",
    "mustProve": [
      "Problem definition and meaningful dataset",
      "Baseline and correct split strategy",
      "Feature engineering and appropriate models",
      "Cross-validation and justified tuning",
      "Metric selection and leakage prevention",
      "Error analysis, reproducibility and limitations"
    ],
    "guardrails": [
      "Strong families include repository issues, mobility, energy, predictive maintenance, public service and finance.",
      "Finance is allowed but no longer the default.",
      "Avoid tutorial-shaped achievements such as Random Forest on Titanic."
    ],
    "resourceIds": [
      "R17",
      "R18",
      "R19"
    ],
    "proof": "Problem → Dataset → Baseline → Experiment design → Models → Evaluation → Error analysis → Conclusions.",
    "completionCheck": "You have framed an ML task, created leakage-free splits, compared models against a simple baseline, and analyzed error failure slices."
  },
  {
    "id": "project-3",
    "name": "Productionize Project 2",
    "status": "not-started",
    "domainBadge": "Productionizes Selected Project 2",
    "purpose": "Move from “I evaluated a model” to “I can operate an ML model as an engineered system.”",
    "direction": "Evolve whichever Project 2 was built (e.g. CivicPulse or your chosen domain) into a tested, containerized, observable inference service with MLflow tracking.",
    "recommendedBuild": "Package the trained model into a FastAPI inference service with MLflow experiment tracking, Docker containerization, automated GitHub Actions CI, and data drift telemetry.",
    "whyThisProblem": "Industry ML engineering requires serving predictions reliably with low latency and monitoring data drift in production.",
    "whoItHelps": "Downstream applications and end users consuming real-time or batch model predictions.",
    "mvp": "Containerized FastAPI inference service with Pydantic request validation, /health and /metrics endpoints, and MLflow artifact versioning.",
    "technicalChallenges": [
      "Managing model loading memory footprint and cold-start latency",
      "Setting up automated data drift detection using statistical distance (PSI/Evidently)",
      "Writing integration tests that verify API responses without re-running full model training"
    ],
    "whatItDemonstrates": "MLOps lifecycle: experiment tracking, model serving, containerization, CI/CD, and drift monitoring.",
    "advancedFeatures": "Asynchronous batch prediction queue, automated Prometheus latency histograms, and model rollback triggers.",
    "whatNotToOverbuild": "Do not deploy a Kubernetes cluster or distributed Kafka pipeline for a single low-to-medium traffic model service.",
    "mustProve": [
      "Clean package and reproducible training",
      "Configuration, model artifacts and experiment tracking",
      "Inference interface with request validation",
      "Docker, automated tests and CI",
      "Deployment, latency, logs and monitoring",
      "Drift awareness and retraining/update strategy"
    ],
    "guardrails": [
      "Use FastAPI or another interface only where appropriate.",
      "Basic cloud deployment belongs here.",
      "Professional SWE Depth and ML Engineering deliberately overlap."
    ],
    "resourceIds": [
      "R20",
      "R6",
      "R7",
      "R30",
      "R10"
    ],
    "proof": "A reproducible, deployed and observable ML service with a maintainable update path.",
    "completionCheck": "You have packaged, tested, served, deployed, and instrumented monitoring for your trained ML model."
  },
  {
    "id": "project-4",
    "name": "Domain-Flexible Deep Learning / Embeddings / Retrieval Project",
    "status": "not-started",
    "domainBadge": "Domain-Flexible Example: RoadSight (PyTorch Mandatory)",
    "recommendedExample": "RoadSight — Infrastructure defect severity classification & multimodal visual search using PyTorch CNN/Vision Transformer adaptation, embeddings, and similarity evaluation.",
    "purpose": "Prove PyTorch, neural networks, embeddings, transformers and/or retrieval through a domain-flexible problem with genuine hands-on PyTorch model work.",
    "direction": "Possible directions: semantic search over a meaningful corpus, neural classification, road defect severity, or domain-specific embedding experiments. Hands-on PyTorch model construction, training or fine-tuning is mandatory (hosted/pretrained inference alone is insufficient).",
    "recommendedBuild": "Custom PyTorch Dataset/DataLoader, fine-tuned backbone (e.g. ResNet/ViT or text transformer), custom loss/training loop with AdamW/CosineAnnealing, gradient clipping, checkpointing, and evaluation curves.",
    "whyThisProblem": "Real image/multimodal datasets require custom data loaders, augmentation, device management (GPU/MPS), and loss debugging.",
    "whoItHelps": "Transportation departments and road maintenance inspectors prioritizing repairs.",
    "mvp": "Trained/fine-tuned PyTorch model with training/validation loss curves, checkpoint saving, and comparison against a classical baseline.",
    "technicalChallenges": [
      "Diagnosing gradient vanishing/explosion and tuning learning rate schedules",
      "Writing efficient custom PyTorch DataLoaders with on-the-fly augmentations without CPU bottlenecks",
      "Evaluating embedding quality using cosine distance distributions and nearest-neighbor search"
    ],
    "whatItDemonstrates": "PyTorch engineering competence, neural network mechanics, loss debugging, and embedding evaluation.",
    "advancedFeatures": "Multimodal text-to-image embedding similarity search, mixed precision training (torch.cuda.amp / bfloat16), and ONNX export.",
    "whatNotToOverbuild": "Do not attempt multi-billion parameter model pretraining from scratch; focused adaptation and fine-tuning provide superior engineering proof.",
    "mustProve": [
      "Real dataset handling and baseline comparison",
      "Genuine PyTorch model construction, adaptation or meaningful fine-tuning",
      "Training or fine-tuning in PyTorch",
      "Appropriate evaluation and model/training debugging",
      "Embeddings/retrieval evaluation where relevant",
      "Error analysis, reproducibility and latency/resource awareness"
    ],
    "guardrails": [
      "Hosted embedding APIs alone do not satisfy the PyTorch milestone.",
      "Plug-and-play pipelines, vector databases and high-level inference alone are insufficient.",
      "No large LLM, expensive GPU fleet or research-scale training is required.",
      "A strong structure is classical baseline → pretrained embedding baseline → PyTorch neural/fine-tuned approach → evaluation → error analysis → quality/performance comparison."
    ],
    "resourceIds": [
      "R21",
      "R22"
    ],
    "proof": "A reasonably sized hands-on PyTorch implementation with meaningful training, evaluation and debugging—independent of Project 5.",
    "completionCheck": "You have built, trained or fine-tuned, evaluated, and debugged a neural model in PyTorch on custom data."
  },
  {
    "id": "project-5",
    "name": "ATLAS Context Engine / RepoScope",
    "status": "not-started",
    "domainBadge": "Specialization: RepoScope / Context Engine",
    "recommendedExample": "RepoScope — Repository Context & Symbol Intelligence engine that parses codebase AST, builds hybrid retrieval (BM25 + symbol graph + dense embeddings), and packs optimized context for LLM code agents.",
    "purpose": "Deliberately test whether AI Developer Infrastructure + Context / Repository Intelligence deserves specialization.",
    "direction": "Repository inventory + symbols/dependencies/history/tests/docs/task context → lexical/vector/graph/hybrid retrieval → context selector → context pack → coding agent/LLM.",
    "recommendedBuild": "AST-aware parser + hybrid retrieval benchmark showing measurable recall improvement and 40%+ token reduction on coding tasks against naive dump baselines.",
    "whyThisProblem": "Standard RAG fails on code repositories because function calls, types, and cross-file dependencies are not captured by naive text chunking.",
    "whoItHelps": "Developers and AI coding agents needing high-precision, token-efficient repository context.",
    "mvp": "AST-aware parser + hybrid retrieval benchmark showing measurable recall improvement and token reduction on coding tasks.",
    "technicalChallenges": [
      "Extracting AST symbol definitions and call graphs efficiently",
      "Combining dense vector search with sparse lexical search and symbol graph traversal",
      "Building an evaluation harness measuring task accuracy and hallucination rate"
    ],
    "whatItDemonstrates": "Advanced context engineering, hybrid retrieval, agent tool integration, and systematic LLM evaluation.",
    "advancedFeatures": "MCP server interface for Claude/Cursor integration, AST incremental index caching, and trajectory evaluation.",
    "whatNotToOverbuild": "Do not build a generic IDE or chat interface; focus on measurable retrieval and context optimization benchmarks.",
    "mustProve": [
      "Compare raw dump, naive embeddings, lexical, hybrid, structure-aware, graph+retrieval and the context-selection algorithm",
      "Relevant-file/context recall and incorrect-context rate",
      "Task success, hallucinated entities and patch/test correctness",
      "Tokens, latency and cost where applicable",
      "Permission boundaries, traces, caching and evaluation harness"
    ],
    "guardrails": [
      "Not ZIP → Markdown, XML conversion or “send fewer characters.”",
      "MCP is optional and should exist only where useful.",
      "Specialization follows technical signal + personal signal + market signal."
    ],
    "resourceIds": [
      "R27",
      "R24",
      "R25",
      "R28"
    ],
    "proof": "Measurable improvement in coding-task accuracy, context relevance, token efficiency, latency or agent reliability against credible baselines.",
    "completionCheck": "You have benchmarked context selection against baselines, demonstrating measurable token reduction and task accuracy."
  }
];

  const roles = [
  {
    "id": "swe-intern",
    "name": "SWE Internship",
    "state": "apply-now",
    "label": "APPLY NOW",
    "whatItDoes": "Contribute scoped product or platform work with guidance: debug, implement, test and collaborate through a real repository.",
    "summary": "Programming, product applications, Git workflow and early production contribution already overlap real internship requirements.",
    "searchTitles": [
      "Software Engineer Intern",
      "Backend Engineer Intern",
      "Full Stack Engineer Intern"
    ],
    "have": [
      "Working React/TypeScript and Python applications",
      "Git, pull-request and production contribution exposure",
      "Application-level debugging and ownership"
    ],
    "requirements": [
      "Programming",
      "Git/PR workflow",
      "Application projects",
      "DSA/OOP basics"
    ],
    "develop": [
      "Testing",
      "Backend depth",
      "Databases",
      "Docker"
    ],
    "requiredNodeIds": [
      "python-engineering",
      "git-workflow",
      "debugging"
    ],
    "helpfulNodeIds": [
      "testing",
      "http-api",
      "relational-db",
      "backend",
      "dsa"
    ],
    "requiredProjects": [
      "project-1"
    ],
    "helpfulProjects": [],
    "interviewExpectations": "Basic DSA (arrays, strings, hash maps), Git workflow, tracing an API request, explaining your project architecture, and debugging a scenario.",
    "projectId": "project-1",
    "resume": [
      "Lead with the strongest authentic application and the specific engineering surface owned.",
      "Describe one production contribution as problem → change → review/QA outcome."
    ],
    "platformIds": [
      "linkedin",
      "wellfound",
      "internshala",
      "unstop"
    ],
    "skipWhen": [
      "The listing requires full-time availability that conflicts with study.",
      "The work is primarily unpaid sales, data entry or training-fee placement."
    ]
  },
  {
    "id": "junior-swe",
    "name": "Junior Software Engineer",
    "state": "prepare-first",
    "label": "PREPARE FIRST",
    "whatItDoes": "Own small-to-medium product changes and increasingly handle testing, backend, database and release quality.",
    "summary": "The gap is not basic coding; it is a clearly inspectable production-grade repository across backend, testing, CI, and operations.",
    "searchTitles": [
      "Junior Software Engineer",
      "Associate Software Engineer",
      "Backend Developer — Entry Level"
    ],
    "have": [
      "Strong application foundation",
      "Early real-team workflow",
      "Partial backend and database evidence"
    ],
    "requirements": [
      "SWE Core",
      "Serious production project",
      "Tests + CI",
      "Backend/DB",
      "Deployment",
      "DSA readiness"
    ],
    "develop": [
      "Testing + CI first",
      "Docker and backend/database depth",
      "Cloud fundamentals",
      "System design",
      "Observability"
    ],
    "requiredNodeIds": [
      "testing",
      "docker",
      "basic-ci",
      "backend",
      "relational-db",
      "dsa"
    ],
    "helpfulNodeIds": [
      "production-deployment",
      "system-design",
      "cloud-fundamentals",
      "backend-db-depth",
      "observability-reliability",
      "software-security"
    ],
    "requiredProjects": [
      "project-1"
    ],
    "helpfulProjects": [
      "project-3"
    ],
    "interviewExpectations": "Medium DSA problem solving, API & schema design, ACID transactions, CI/CD pipeline automation, and debugging production regressions.",
    "projectId": "project-1",
    "resume": [
      "Show Project 1 as an engineered system, not a feature list.",
      "Include tests, CI, architecture, database and operational decisions with measured outcomes."
    ],
    "platformIds": [
      "linkedin",
      "wellfound"
    ],
    "skipWhen": [
      "The role is senior in responsibility despite a junior title.",
      "The listing requires multiple years of specialized production ownership with no equivalent-project flexibility."
    ]
  },
  {
    "id": "data-ml-intern",
    "name": "Data / ML Internship",
    "state": "prepare-first",
    "label": "PREPARE FIRST",
    "whatItDoes": "Prepare data, run experiments, evaluate models and communicate limitations under an applied team workflow.",
    "summary": "Data experience exists; rigorous classical ML, split strategies, leakage prevention, and evaluation evidence are still missing.",
    "searchTitles": [
      "Machine Learning Intern",
      "Data Science Intern",
      "Applied ML Intern"
    ],
    "have": [
      "Python and pandas/EDA evidence",
      "Software-building foundation",
      "Existing data visualization work"
    ],
    "requirements": [
      "SWE Core",
      "Python/data stack",
      "Math foundations",
      "Classical ML",
      "Rigorous Project 2"
    ],
    "develop": [
      "Probability/statistics verification",
      "Leakage-safe splits and evaluation",
      "Rigorous Project 2",
      "SQL depth",
      "Experiment design"
    ],
    "requiredNodeIds": [
      "numpy",
      "pandas-eda",
      "data-quality",
      "ml-problem-framing",
      "ml-data-splits",
      "ml-models",
      "ml-evaluation"
    ],
    "helpfulNodeIds": [
      "linear-algebra",
      "probability-statistics",
      "ml-reproducibility",
      "experiment-tracking"
    ],
    "requiredProjects": [
      "project-2"
    ],
    "helpfulProjects": [
      "project-1"
    ],
    "interviewExpectations": "Pandas data cleaning, train/val/test split rationale, metrics trade-offs (Precision vs Recall vs ROC-AUC), handling imbalanced data, and classical model trade-offs.",
    "projectId": "project-2",
    "resume": [
      "Keep current data evidence concise until Project 2 proves a complete ML loop.",
      "After Project 2, lead with baseline, split, metric choice, error analysis and reproducibility."
    ],
    "platformIds": [
      "linkedin",
      "wellfound",
      "internshala"
    ],
    "skipWhen": [
      "The role is mainly dashboard reporting but is advertised as ML.",
      "The listing expects production ML ownership before allowing supervised internship-level learning."
    ]
  },
  {
    "id": "ai-ml-intern",
    "name": "AI / ML Internship",
    "state": "apply-selectively",
    "label": "APPLY SELECTIVELY",
    "whatItDoes": "Build software around models, data or evaluation; the exact balance varies widely across startups and research teams.",
    "summary": "Not broadly ready for generic MLE roles, but software-heavy AI/startup/tooling roles may fit local-LLM, backend, and SWE evidence.",
    "searchTitles": [
      "AI Engineer Intern",
      "Applied AI Intern",
      "LLM Application Intern",
      "AI Software Engineer Intern"
    ],
    "have": [
      "Local LLM inference systems",
      "Strong application-building overlap",
      "Agent-routing and AI-tooling exposure"
    ],
    "requirements": [
      "Data/ML readiness",
      "PyTorch basics",
      "Transformer understanding",
      "Strong evaluation"
    ],
    "develop": [
      "Project 4",
      "LLM evaluation",
      "Retrieval measurement",
      "PyTorch fundamentals"
    ],
    "requiredNodeIds": [
      "local-llm",
      "transformers",
      "llm-inference",
      "backend"
    ],
    "helpfulNodeIds": [
      "pytorch",
      "retrieval-rag",
      "llm-evals",
      "context-engineering"
    ],
    "requiredProjects": [
      "project-1"
    ],
    "helpfulProjects": [
      "project-4",
      "project-5"
    ],
    "interviewExpectations": "LLM tokenization, sampling parameters (temperature, top_p), prompt engineering, RAG architecture, vector search, and latency/cost trade-offs.",
    "projectId": "project-4",
    "resume": [
      "Target software-heavy AI roles using the strongest local-AI system and honest scope.",
      "Do not imply model training, fine-tuning or rigorous evaluation until it is demonstrated."
    ],
    "platformIds": [
      "linkedin",
      "wellfound",
      "unstop"
    ],
    "skipWhen": [
      "The core work requires model training or research evidence that is not yet present.",
      "The listing is a generic prompt-engineering role with no software, data or evaluation ownership."
    ]
  },
  {
    "id": "junior-ml",
    "name": "Junior ML Engineer",
    "state": "not-yet",
    "label": "NOT YET",
    "whatItDoes": "Build reproducible training and serving systems, then operate model quality and service behavior in production.",
    "summary": "Professional SWE Depth and MLOps become significantly more important at this point.",
    "searchTitles": [
      "Junior Machine Learning Engineer",
      "Associate ML Engineer",
      "ML Platform Engineer — Entry Level"
    ],
    "have": [
      "Software foundation",
      "Partial backend and data skills"
    ],
    "requirements": [
      "Rigorous ML",
      "Production ML service",
      "Reproducibility",
      "Deployment",
      "Monitoring",
      "PyTorch",
      "Data pipelines"
    ],
    "develop": [
      "Projects 2 and 3",
      "PyTorch through Project 4",
      "Cloud",
      "System-design reasoning"
    ],
    "requiredNodeIds": [
      "experiment-tracking",
      "ml-pipelines",
      "model-serving",
      "ml-deployment",
      "ml-monitoring",
      "pytorch"
    ],
    "helpfulNodeIds": [
      "cloud-fundamentals",
      "system-design",
      "observability-reliability"
    ],
    "requiredProjects": [
      "project-2",
      "project-3",
      "project-4"
    ],
    "helpfulProjects": [],
    "interviewExpectations": "ML pipeline design, experiment lineage with MLflow, FastAPI model serving, Dockerizing model services, detecting data drift, and PyTorch training loops.",
    "projectId": "project-3",
    "resume": [
      "Wait for Project 3 before making production-ML claims.",
      "Show experiment lineage, serving, deployment, monitoring and update strategy."
    ],
    "platformIds": [
      "linkedin",
      "wellfound"
    ],
    "skipWhen": [
      "The role requires independent production ML ownership before Project 3 evidence exists."
    ]
  },
  {
    "id": "applied-ai",
    "name": "Applied AI / AI Engineer",
    "state": "not-yet",
    "label": "NOT YET",
    "whatItDoes": "Combine models, retrieval, tools, evaluation and product engineering into reliable user-facing AI behavior.",
    "summary": "Strong proof is a system with known failure modes, an evaluation dataset, measurements and demonstrated improvement.",
    "searchTitles": [
      "Applied AI Engineer",
      "AI Engineer",
      "LLM Engineer",
      "Agent Systems Engineer"
    ],
    "have": [
      "Local inference and early agent-system exposure",
      "Strong software-building direction"
    ],
    "requirements": [
      "Strong SWE",
      "ML + LLM fundamentals",
      "Retrieval/RAG",
      "Tools/agents",
      "Evals/tracing",
      "Security/reliability"
    ],
    "develop": [
      "Projects 4 and 5",
      "LLM and retrieval evals",
      "Production AI"
    ],
    "requiredNodeIds": [
      "retrieval-rag",
      "agents",
      "context-engineering",
      "llm-evals",
      "ai-observability",
      "ai-reliability",
      "ai-security",
      "ai-economics",
      "feedback-loops"
    ],
    "helpfulNodeIds": [
      "mcp",
      "pytorch",
      "system-design"
    ],
    "requiredProjects": [
      "project-4",
      "project-5"
    ],
    "helpfulProjects": [
      "project-3"
    ],
    "interviewExpectations": "Hybrid RAG retrieval (BM25 + Dense + Reranking), ReAct agent tool loops, evaluation harness design, prompt injection security, and latency attribution.",
    "projectId": "project-5",
    "resume": [
      "Lead with measured system behavior, not framework names.",
      "Include baselines, evaluation cases, failure taxonomy, latency/cost and reliability controls."
    ],
    "platformIds": [
      "linkedin",
      "wellfound"
    ],
    "skipWhen": [
      "The role treats prompt wrappers as sufficient engineering.",
      "The listing expects large-scale model research or infrastructure outside the demonstrated branch."
    ]
  },
  {
    "id": "ai-platform",
    "name": "AI Platform / Infrastructure",
    "state": "not-yet",
    "label": "NOT YET",
    "whatItDoes": "Build shared systems for model serving, developer workflows, reliability, performance and controlled access.",
    "summary": "Requires deeper Linux, cloud, systems, containers, observability, performance, serving and concurrency.",
    "searchTitles": [
      "AI Platform Engineer",
      "ML Platform Engineer",
      "AI Infrastructure Engineer",
      "Inference Engineer"
    ],
    "have": [
      "Local-model and developer-tooling interest",
      "A software foundation that can grow into systems depth"
    ],
    "requirements": [
      "Production AI",
      "Cloud",
      "System design",
      "Reliability",
      "Performance",
      "Serving"
    ],
    "develop": [
      "Project 5",
      "Professional SWE Depth",
      "Distributed systems only when the role needs it"
    ],
    "requiredNodeIds": [
      "system-design",
      "cloud-fundamentals",
      "backend-db-depth",
      "performance-concurrency",
      "ai-observability",
      "dev-infra-branch"
    ],
    "helpfulNodeIds": [
      "operational-maturity",
      "ai-security"
    ],
    "requiredProjects": [
      "project-3",
      "project-5"
    ],
    "helpfulProjects": [],
    "interviewExpectations": "Distributed systems primitives, connection pooling, high-throughput model serving, caching layers, container orchestration, and hardware acceleration bottlenecks.",
    "projectId": "project-5",
    "resume": [
      "Use Project 5 only if benchmarks prove a real infrastructure advantage.",
      "Emphasize reliability, observability, permissions, performance and system trade-offs."
    ],
    "platformIds": [
      "linkedin",
      "wellfound"
    ],
    "skipWhen": [
      "The role centers distributed GPU training or kernel work that ATLAS has intentionally deferred."
    ]
  }
];

  const opportunities = [
  {
    "id": "mitacs-2027",
    "name": "Mitacs Globalink Research Internship 2027",
    "status": "CURRENTLY NOT ELIGIBLE — INSTITUTION NOT ON 2027 INDIA ELIGIBILITY LIST",
    "deadline": "September 16, 2026 (For Reference)",
    "recheckNote": "Recheck in future cycles when institution lists are updated",
    "featured": true,
    "verified": "15 Aug 2026",
    "url": "https://www.mitacs.ca/en/programs/globalink/globalink-research-internship",
    "summary": "Mitacs GRI 2027 provides fully funded 12-week research internships at Canadian universities for eligible international undergraduate students.",
    "eligibilityWarning": "IMPORTANT ELIGIBILITY RULE: For students in India, Mitacs eligibility requires being enrolled at an institution listed on the official AICTE-Mitacs partner list. Check your institution inside the Mitacs portal during application. If your institution is not listed, you are CURRENTLY NOT ELIGIBLE unless your university contacts helpdesk@mitacs.ca to verify approval.",
    "actions": [
      "Search your home institution in the Mitacs student portal dropdown",
      "Verify minimum CGPA requirement (70% / 8.0+ recommended) and at least 2 years completed with 1-3 semesters remaining as of Fall 2027",
      "Prepare academic CV, transcript, and at least one professor recommendation letter",
      "Select up to 7 eligible research projects in Computer Science / AI / Systems"
    ],
    "note": "A prestigious calendar opportunity, never a prerequisite for engineering career success."
  },
  {
    "id": "mlh",
    "name": "MLH Fellowship (Software Engineering)",
    "status": "Fall 2026 Cohort Open (Rolling Admissions)",
    "featured": false,
    "date": "Fall 2026 Dates: Sep 14, 2026 – Dec 4, 2026 · Deadline: Aug 31, 2026",
    "verified": "15 Aug 2026",
    "url": "https://fellowship.mlh.io/",
    "summary": "A 12-week remote internship alternative where fellows contribute to open-source software and production projects with mentorship.",
    "eligibilityWarning": "Track notice: Software Engineering and Open Source tracks are featured. Verify regional stipend and country eligibility on the MLH portal (some tracks restrict certain country residencies for stipend distribution, while contributor tracks remain globally open).",
    "actions": [
      "Submit application early on the MLH portal (admissions are strictly rolling)",
      "Prepare a strong personal GitHub code sample for the technical review interview",
      "Emphasize authentic software development and collaborative Git workflow"
    ],
    "note": "High-signal practical open-source engineering experience."
  },
  {
    "id": "gsoc",
    "name": "Google Summer of Code (GSoC 2027)",
    "status": "Prepare for GSoC 2027 · Timeline Not Yet Published",
    "featured": false,
    "date": "2027 Schedule: NOT YET PUBLISHED (Expected announcement in Q4 2026 / late 2026)",
    "verified": "15 Aug 2026",
    "url": "https://summerofcode.withgoogle.com/",
    "summary": "Global program connecting student/new contributors with open-source organizations. Note: GSoC is a mentorship program with open-source organizations, NOT a Google corporate internship.",
    "eligibilityWarning": "AI POLICY & ETHICS WARNING: GSoC organizations strictly regulate AI usage. Do NOT submit AI-generated proposal text or hallucinated code pull requests. Genuine understanding of the organization codebase and human communication on public mailing lists/GitHub issues are mandatory.",
    "actions": [
      "Explore archive of accepted mentoring organizations (Python, Linux, PyTorch, Apache, LLVM)",
      "Set up local development environments and begin making small, genuine documentation/bug-fix PRs in Q4 2026",
      "Engage with maintainers and draft project proposals when 2027 organizations are announced (typically Feb/March 2027)"
    ],
    "note": "Prepare by contributing to open source now; do not invent 2027 dates."
  },
  {
    "id": "lfx",
    "name": "LFX Mentorship (Linux Foundation)",
    "status": "Fall 2026 Term Active · 3 Terms Per Year (Spring, Summer, Fall)",
    "featured": false,
    "date": "Fall Term: Sep – Nov · Spring Term: March – May · Summer Term: June – Aug",
    "verified": "15 Aug 2026",
    "url": "https://mentorship.lfx.linuxfoundation.org/",
    "summary": "Structured, paid open-source mentorship program sponsored by the Linux Foundation across CNCF, PyTorch Foundation, Linux kernel, and cloud native projects.",
    "eligibilityWarning": "Open to developers 18+ legally eligible to work in their jurisdiction. Applicants can apply to a maximum of 3 project mentorships per term. Must not be a prior LFX mentee.",
    "actions": [
      "Create profile on LFX Mentorship platform",
      "Filter projects by technology (e.g. Python, Docker, Go, Kubernetes, ML)",
      "Complete project-specific pre-requisite coding challenges or submission tasks",
      "Submit targeted application with CV and proof of eligibility"
    ],
    "note": "Top-tier systems and infrastructure open-source proof."
  }
];

  const internshipChecklist = {
  "title": "Internship Quality & Legitimacy Checklist",
  "summary": "Evaluate every job or internship opportunity against engineering substance rather than brand name.",
  "criteria": [
    {
      "label": "Real Engineering Ownership",
      "check": "The role involves writing, testing, or deploying actual code/systems rather than non-technical operations."
    },
    {
      "label": "Mentorship & Code Review",
      "check": "Senior engineers review your pull requests and provide technical guidance."
    },
    {
      "label": "Fair Terms & Compensation",
      "check": "Legitimate internships pay fair stipends/wages. Avoid unpaid sales, marketing dressed as tech, or companies charging \"training fees\"."
    },
    {
      "label": "Inspectable Artifacts",
      "check": "You will be allowed to discuss the high-level architecture and engineering challenges on your resume and in interviews."
    }
  ]
};

  const discoveryStack = [
  {
    "id": "apple",
    "name": "Apple Jobs",
    "url": "https://jobs.apple.com/"
  },
  {
    "id": "microsoft",
    "name": "Microsoft Careers",
    "url": "https://jobs.careers.microsoft.com/"
  },
  {
    "id": "amazon",
    "name": "Amazon Jobs",
    "url": "https://www.amazon.jobs/"
  },
  {
    "id": "sarvam",
    "name": "Sarvam AI Careers",
    "url": "https://www.sarvam.ai/careers"
  },
  {
    "id": "linkedin",
    "name": "LinkedIn Jobs",
    "url": "https://www.linkedin.com/jobs/",
    "searchPattern": "https://www.linkedin.com/jobs/search/?keywords={query}"
  },
  {
    "id": "wellfound",
    "name": "Wellfound",
    "url": "https://wellfound.com/jobs",
    "searchPattern": "https://wellfound.com/jobs?query={query}"
  },
  {
    "id": "internshala",
    "name": "Internshala",
    "url": "https://internshala.com/internships/"
  },
  {
    "id": "unstop",
    "name": "Unstop",
    "url": "https://unstop.com/internships"
  }
];

  const experience = [
  {
    "name": "Real engineering work",
    "icon": "PR",
    "summary": "Production contribution has already begun. Continue accumulating Jira → implementation → review/QA evidence without exaggerating it as formal full-time employment.",
    "items": [
      "Eternos or similar work",
      "Difficult bug stories",
      "Architecture decisions",
      "Collaboration and ownership"
    ]
  },
  {
    "name": "Internships + opportunities",
    "icon": "↗",
    "summary": "Apply when actual role requirements overlap demonstrated capability. Do not wait for a stage label.",
    "items": [
      "SWE/backend now",
      "Data/ML after rigorous evidence",
      "Software-heavy AI selectively",
      "Research when calendar fit exists"
    ]
  },
  {
    "name": "Open source",
    "icon": "OS",
    "summary": "Contribute because the software matters and the work is useful—not to manufacture a resume bullet.",
    "items": [
      "Understand architecture",
      "Docs/tests where useful",
      "Bug fixes and regressions",
      "Repeat contributions to tools used"
    ]
  },
  {
    "name": "Interview readiness",
    "icon": "DS",
    "summary": "Maintain light DSA and progressively add systems, ML and AI topics as the corresponding evidence develops.",
    "items": [
      "DSA/debugging/HTTP/DB now",
      "System design after Core",
      "ML design after Project 3",
      "RAG/evals/agents after Stage 7"
    ]
  }
];

  const education = {
  "metadata": [
    [
      "Current degree",
      "B.Tech Computer Engineering"
    ],
    [
      "Study period",
      "Aug 2024 – Feb 2028"
    ],
    [
      "Expected graduation",
      "February 2028"
    ],
    [
      "Future direction",
      "Optional Master’s / advanced study"
    ],
    [
      "Career dependency",
      "Independent of country or degree choice"
    ]
  ],
  "hierarchy": [
    {
      "id": "career",
      "label": "Map A",
      "name": "Career / Engineering",
      "role": "Primary",
      "summary": "The frozen competency and evidence map. It remains fully useful if Canada never happens."
    },
    {
      "id": "education",
      "label": "Map B",
      "name": "Education",
      "role": "Secondary",
      "summary": "Bachelor’s progression, graduate-study decisions, applications, academic preparation and funding."
    },
    {
      "id": "canada",
      "label": "Map C",
      "name": "Canada / Immigration",
      "role": "Strategic reference",
      "summary": "Policy-sensitive education, location and immigration research that is revalidated before action."
    }
  ],
  "sectionNav": [
    [
      "overview",
      "Overview"
    ],
    [
      "education-strategy",
      "Education Strategy"
    ],
    [
      "university-options",
      "University Options"
    ],
    [
      "lakehead-alternatives",
      "Lakehead / Alternatives"
    ],
    [
      "location-analysis",
      "Location Analysis"
    ],
    [
      "language-strategy",
      "Language Strategy"
    ],
    [
      "financial-planning",
      "Financial Planning"
    ],
    [
      "canada-requirements",
      "Canada Requirements"
    ],
    [
      "immigration-reference",
      "Immigration Reference"
    ],
    [
      "decision-checkpoints",
      "Decision Checkpoints"
    ],
    [
      "canada-trajectory",
      "Canada Reference Trajectory"
    ]
  ],
  "planningHorizon": {
    "label": "Reference study-start horizon",
    "value": "2028+",
    "reference": "Fall 2028 is one possible reference intake, depending on graduation, admission outcomes, actual program intake, finances and strategic fit.",
    "status": "ESTIMATED / NON-BINDING / STRATEGY-DEPENDENT",
    "meaning": "This is a planning horizon, not a relocation deadline or a technical deadline. Engineering progression must never be compressed, skipped or weakened to reach it.",
    "objective": "Become as professionally valuable as possible before potentially moving to Canada."
  },
  "valueBuilding": {
    "title": "Before a possible Canada move",
    "summary": "Continue maximizing the career assets that naturally become relevant through the normal engineering roadmap. These are career assets, not independent Canada requirements.",
    "assets": [
      "Software-engineering capability",
      "Backend and systems knowledge",
      "Python",
      "Data and ML competence",
      "ML/AI engineering when prerequisites allow",
      "Serious projects and GitHub evidence",
      "Internships or real professional experience when available",
      "Open source where valuable",
      "Interview and system-design readiness",
      "Communication, references and professional network",
      "Paid technical experience where realistically available"
    ],
    "experienceLabel": "HIGH VALUE — NOT MANDATORY",
    "experienceFlow": [
      "Skills",
      "Project evidence",
      "Internship / real experience",
      "Stronger projects",
      "Better opportunities",
      "Canada with existing professional value"
    ],
    "guardrail": "ATLAS does not assume an internship, remote work or AI employment will happen before graduation. Readiness plus actual opportunity requirements—not a job-title sequence—guides applications."
  },
  "mastersDecision": {
    "principle": "Compare University + Exact Program + Route + Campus + Cost + Career Opportunity + Research + Experience + Life Value + Current Policy Context.",
    "routes": [
      "Course-based",
      "Project-based",
      "Thesis / research",
      "Co-op",
      "Professional",
      "Specialized AI route"
    ],
    "preparation": [
      "Current transcript and GPA",
      "CS / math prerequisite mapping",
      "Country and program-type choice",
      "SOP or research statement",
      "References",
      "Admission language evidence",
      "Funding and scholarship evidence",
      "Application deadlines and documents"
    ],
    "guardrails": [
      "Same university does not mean the same program value, cost, duration, research opportunity, co-op availability or immigration implication.",
      "Meeting a published minimum does not guarantee admission.",
      "Admission competitiveness and assessment confidence are separate fields.",
      "No university is ranked by one opaque score."
    ]
  },
  "policySnapshot": {
    "referenceDate": "2026-08-12",
    "status": "CURRENT REFERENCE ONLY — NOT A 2028 GUARANTEE",
    "note": "These records answer what is useful for planning now. They are not legal advice and must be revalidated at the listed decision trigger.",
    "sourceHierarchy": [
      "IRCC / Canada.ca",
      "Relevant official provincial government",
      "Official university sources",
      "Other government or regulatory sources",
      "Reputable secondary sources only as supplementary analysis"
    ],
    "records": [
      {
        "id": "public-graduate-pal-tal",
        "rule": "Public Master’s / Doctoral PAL/TAL exemption",
        "verificationStatus": "CURRENT",
        "policyState": "CURRENT",
        "effectiveDate": "2026-01-01",
        "appliesTo": "Study-permit applicants to degree-granting master’s or doctoral programs at public institutions; Quebec retains separate provincial requirements.",
        "confirmed": "Qualifying applicants currently do not need a provincial or territorial attestation letter for the study-permit application.",
        "implication": "A qualifying public-university master’s currently has a simpler PAL/TAL position than many other study pathways. This must not influence technical progression.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "Before the study-permit application",
        "source": {
          "name": "IRCC — Graduate student study permits",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/graduate-student/how-to-apply.html"
        }
      },
      {
        "id": "masters-pgwp-length",
        "rule": "Current PGWP treatment of master’s degrees",
        "verificationStatus": "CURRENT",
        "policyState": "CURRENT",
        "effectiveDate": "2024-02-15",
        "appliesTo": "Qualifying master’s degree programs of at least eight months when every other PGWP eligibility requirement is met.",
        "confirmed": "A qualifying master’s may currently support a three-year PGWP even when the master’s itself is shorter than two years.",
        "implication": "Do not assume a shorter master’s automatically means a shorter PGWP. Compare career value, cost, research, experience and exact-program eligibility.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "Before accepting an offer and again before PGWP application",
        "source": {
          "name": "IRCC — PGWP eligibility",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html"
        }
      },
      {
        "id": "degree-pgwp-language",
        "rule": "PGWP language and field-of-study rules for degree graduates",
        "verificationStatus": "CURRENT",
        "policyState": "CURRENT",
        "effectiveDate": "2024-11-01",
        "appliesTo": "Bachelor’s, master’s and doctoral graduates subject to the post-November-1-2024 PGWP rules.",
        "confirmed": "Current rules require CLB 7 / NCLC 7 in all four abilities. Degree graduates currently have no PGWP field-of-study requirement.",
        "implication": "University-admission language and PGWP language remain separate. A degree program must not inherit rules intended for non-degree programs.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "Before choosing a test and again before PGWP application",
        "source": {
          "name": "IRCC — PGWP eligibility",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html"
        }
      },
      {
        "id": "student-work-limit",
        "rule": "Current off-campus student work limit",
        "verificationStatus": "CURRENT",
        "policyState": "CURRENT",
        "appliesTo": "Eligible international students who meet the study-permit work conditions.",
        "confirmed": "Eligible students can currently work up to 24 hours per week off campus during regular terms and unlimited hours during qualifying scheduled breaks.",
        "implication": "Part-time work may add experience or income, but core affordability must not depend on assumed student employment.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "Before travel, after permit issuance and whenever work conditions change",
        "source": {
          "name": "IRCC — Work off campus",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html"
        }
      },
      {
        "id": "dli-not-pgwp-guarantee",
        "rule": "DLI status alone does not guarantee PGWP eligibility",
        "verificationStatus": "CURRENT",
        "policyState": "CURRENT",
        "appliesTo": "Every institution, campus, credential, exact program and route being considered.",
        "confirmed": "Not every program at a designated learning institution is PGWP-eligible, and all other eligibility requirements still apply.",
        "implication": "Evaluate exact university + exact program + exact credential + exact route + exact campus. Never store “University X = PGWP eligible.”",
        "changeRisk": "MEDIUM",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "Before accepting an offer or paying a substantial deposit",
        "source": {
          "name": "IRCC — Designated learning institutions",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html"
        }
      },
      {
        "id": "proof-of-funds",
        "rule": "Study-permit financial-support baseline",
        "value": "CAD 22,895",
        "verificationStatus": "REVERIFY SOON",
        "policyState": "CURRENT",
        "effectiveDate": "2025-09-01",
        "appliesTo": "One study-permit applicant outside Quebec; excludes tuition and transportation.",
        "confirmed": "IRCC currently lists CAD 22,895 as the first-year living-expense evidence amount. The published amount is updated annually.",
        "implication": "This is an evidence threshold, not a prediction of actual Thunder Bay living costs and not the complete cost of education.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "2026-09-01",
        "freshnessRule": "After the revalidation point, the stored value must not appear as a current requirement unless the official source has been checked again.",
        "source": {
          "name": "IRCC — Financial support",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html"
        }
      },
      {
        "id": "oinp-masters-graduate",
        "rule": "OINP Master’s Graduate Stream",
        "verificationStatus": "CURRENT",
        "policyState": "SUPERSEDED",
        "closureDate": "2026-05-30",
        "appliesTo": "Historical Ontario Master’s Graduate stream.",
        "confirmed": "The former Master’s Graduate stream is no longer an active OINP pathway.",
        "implication": "Do not use “Ontario master’s → OINP Master’s Graduate” as an active planning pathway or infer a direct one-to-one replacement.",
        "changeRisk": "HIGH",
        "lastVerified": "2026-08-12",
        "nextRevalidationPoint": "When Ontario immigration strategy becomes actionable",
        "supersededBy": "2026 OINP redesigned framework",
        "source": {
          "name": "Government of Ontario — 2026 OINP updates",
          "url": "https://www.ontario.ca/page/2026-ontario-immigrant-nominee-program-updates"
        }
      }
    ]
  },
  "universitySnapshot": {
    "title": "Current University Research Snapshot — August 2026",
    "status": "ORIENTATION ONLY — NOT FINAL 2028 SHORTLIST",
    "rule": "These options represent different strategic choices. They are not numerically ranked and the final shortlist must be rebuilt from the current transcript, finances, interests, career position and then-current official program information.",
    "programs": [
      {
        "id": "lakehead-msc-cs",
        "classification": "REALISTIC OPTION / PERSONAL SIGNIFICANCE — NOT AUTOMATICALLY SELECTED",
        "university": "Lakehead University",
        "programName": "Master of Science in Computer Science",
        "credential": "MSc",
        "routes": [
          "Course",
          "Project",
          "Thesis"
        ],
        "specialization": "Artificial Intelligence specialization: two-year thesis route",
        "campus": "Thunder Bay + Barrie STEM Hub; campus-specific verification required",
        "mode": "In person",
        "normalLength": "Course: 1 year · Project / Thesis / AI thesis: 2 years",
        "intakes": "Live listing showed Winter 2027; every future intake is page-sensitive and must be reverified.",
        "dliNumber": "See campus records",
        "dliCampusMatch": "See campus records",
        "pgwpByCampus": "Current federal master’s rules may apply to an eligible exact program; revalidate the exact campus/program before commitment.",
        "campusRouteAvailability": "Thunder Bay route information may not be inherited by Barrie.",
        "admissionLanguage": "Current general graduate minimum: IELTS Academic 6.5 overall, no band below 6.0; alternatives and any English-medium route require current official confirmation.",
        "pgwpLanguage": "Current federal degree-graduate rule: CLB 7 / NCLC 7 in all four abilities.",
        "currentCost": "2026–27 published tuition CAD 8,708.33 + ancillary CAD 257.43 = CAD 8,965.76 per term. Not a 2028 estimate.",
        "funding": "Scholarships, bursaries, awards, assistantships and faculty support may exist; support is not guaranteed to every graduate student.",
        "experience": "Project and regular Thesis routes currently may access an eight-month co-op after two terms; the dedicated AI specialization is currently not co-op eligible.",
        "research": "Active AI/ML work includes LLMs/RAG, transformers, medical AI and related areas. Supervisor and route fit remain decisive.",
        "competitiveness": "REALISTIC",
        "assessmentConfidence": "PROVISIONAL / NEEDS VERIFICATION",
        "keyVerification": [
          "Current transcript",
          "Current GPA",
          "Computer Engineering → Computer Science prerequisite mapping",
          "Exact program requirements, routes and intakes at application time"
        ],
        "evidenceBasis": "Published B-average threshold and related-discipline consideration are directionally compatible, but actual CS-course equivalency is unresolved.",
        "advantages": [
          "Multiple route choices",
          "Explicit AI research option",
          "Possible co-op on eligible non-AI-specialization routes",
          "Legitimate personal / life value"
        ],
        "tradeoffs": [
          "AI thesis specialization currently sacrifices co-op eligibility",
          "Funding is not guaranteed",
          "Thunder Bay career ecosystem requires separate research",
          "Barrie DLI, PGWP and route assumptions remain unverified",
          "2028 tuition, intake and policy are unknown"
        ],
        "lastVerified": "2026-08-12",
        "source": {
          "name": "Lakehead — MSc Computer Science",
          "url": "https://www.lakeheadu.ca/programs/graduate/programs/masters/computer-science"
        }
      },
      {
        "id": "uottawa-mcs-ai",
        "classification": "AI + CO-OP ECOSYSTEM COMPARISON",
        "university": "University of Ottawa",
        "programName": "Master of Computer Science, Concentration in Applied Artificial Intelligence",
        "credential": "MCS",
        "routes": [
          "Thesis",
          "Coursework + project",
          "Competitive co-op for eligible routes"
        ],
        "specialization": "Applied Artificial Intelligence",
        "campus": "Ottawa",
        "mode": "In person",
        "normalLength": "Route-dependent; reverify during shortlist",
        "intakes": "Fall entry matters for current co-op rules; reverify exact intake and deadlines.",
        "dliNumber": "NEEDS REVALIDATION",
        "dliCampusMatch": "NEEDS REVALIDATION",
        "pgwpByCampus": "Exact current program and campus implications require official decision-time verification.",
        "campusRouteAvailability": "Verify against the exact 2028 catalogue.",
        "admissionLanguage": "Reverify current graduate admission requirements.",
        "pgwpLanguage": "Current federal degree-graduate rule: CLB 7 / NCLC 7 in all four abilities.",
        "currentCost": "Refresh tuition and full Ottawa living-cost baseline during shortlisting.",
        "funding": "Thesis funding and other support require route-specific research.",
        "experience": "Co-op is currently available competitively to eligible thesis and coursework/project students.",
        "research": "Explicit Applied AI curriculum with thesis and project choices.",
        "competitiveness": "COMPETITIVE",
        "assessmentConfidence": "MEDIUM",
        "keyVerification": [
          "Computer Engineering equivalency",
          "CS-course depth",
          "Current co-op eligibility",
          "Supervisor fit for thesis",
          "Current cost and funding"
        ],
        "evidenceBasis": "Published B / 70% minimum is directionally reachable, but minimums do not guarantee admission and equivalency/program competition matter.",
        "advantages": [
          "Explicit Applied AI curriculum",
          "Thesis/project choice",
          "Competitive co-op",
          "Software/systems coursework"
        ],
        "tradeoffs": [
          "Stronger admission competition",
          "Cost needs normalization",
          "Thesis requires supervisor alignment"
        ],
        "lastVerified": "2026-08-12",
        "source": {
          "name": "uOttawa — MCS Applied AI",
          "url": "https://catalogue.uottawa.ca/en/graduate/master-computer-science-specialization-artificialintelligence/"
        }
      },
      {
        "id": "guelph-msc-ai",
        "classification": "FUNDED RESEARCH / AI COMPARISON",
        "university": "University of Guelph",
        "programName": "MSc Computer Science + Collaborative Specialization in Artificial Intelligence",
        "credential": "MSc",
        "routes": [
          "Two-year thesis / research"
        ],
        "specialization": "Collaborative Specialization in AI",
        "campus": "Guelph",
        "mode": "In person",
        "normalLength": "2 years",
        "intakes": "Reverify exact intake and deadlines.",
        "dliNumber": "NEEDS REVALIDATION",
        "dliCampusMatch": "NEEDS REVALIDATION",
        "pgwpByCampus": "Exact current program and campus implications require official decision-time verification.",
        "campusRouteAvailability": "Thesis and AI-specialization structure must be refreshed for the application cycle.",
        "admissionLanguage": "Reverify current graduate admission requirements.",
        "pgwpLanguage": "Current federal degree-graduate rule: CLB 7 / NCLC 7 in all four abilities.",
        "currentCost": "Refresh tuition and full Guelph living-cost baseline during shortlisting.",
        "funding": "Current snapshot lists at least CAD 20,000 annually for up to two years for admitted MSc CS students who secure a graduate faculty advisor; Vector scholarship consideration is not guaranteed.",
        "experience": "Research-first rather than a professional/co-op route.",
        "research": "Deep ML/AI research environment; faculty-advisor alignment is mandatory.",
        "competitiveness": "COMPETITIVE",
        "assessmentConfidence": "MEDIUM",
        "keyVerification": [
          "Equivalent CS preparation",
          "Supervisor availability",
          "Research alignment",
          "Current funding terms",
          "Current program requirements"
        ],
        "evidenceBasis": "Published 75% threshold may be compatible, but advisor, research and equivalent-CS preparation create substantial uncertainty.",
        "advantages": [
          "Deep AI research",
          "Thesis evidence",
          "Conditional current funding baseline",
          "Vector-affiliated ecosystem"
        ],
        "tradeoffs": [
          "Supervisor-dependent",
          "Research-heavy",
          "Less suitable if a professional route becomes preferable"
        ],
        "lastVerified": "2026-08-12",
        "source": {
          "name": "University of Guelph — Collaborative Specialization in AI",
          "url": "https://calendar.uoguelph.ca/graduate-calendar/collaborative-specializations/artificial-intelligence/"
        }
      },
      {
        "id": "manitoba-msc-cs",
        "classification": "FUNDED RESEARCH / VALUE COMPARISON",
        "university": "University of Manitoba",
        "programName": "Master of Science in Computer Science",
        "credential": "MSc",
        "routes": [
          "Two-year thesis / research"
        ],
        "specialization": "ML and systems coursework available in current snapshot",
        "campus": "Winnipeg",
        "mode": "In person",
        "normalLength": "2 years",
        "intakes": "Reverify exact intake and deadlines.",
        "dliNumber": "NEEDS REVALIDATION",
        "dliCampusMatch": "NEEDS REVALIDATION",
        "pgwpByCampus": "Exact current program and campus implications require official decision-time verification.",
        "campusRouteAvailability": "Verify the exact thesis and course structure during shortlisting.",
        "admissionLanguage": "Reverify current graduate admission requirements.",
        "pgwpLanguage": "Current federal degree-graduate rule: CLB 7 / NCLC 7 in all four abilities.",
        "currentCost": "Refresh tuition and full Winnipeg living-cost baseline during shortlisting.",
        "funding": "The current department snapshot states minimum funding of CAD 20,000 per year for the first two years for newly admitted MSc CS students.",
        "experience": "Research and academic employment may provide experience; no co-op assumption is stored.",
        "research": "ML and systems research/value comparison outside Ontario.",
        "competitiveness": "COMPETITIVE",
        "assessmentConfidence": "MEDIUM",
        "keyVerification": [
          "Required CS-course equivalency",
          "Supervisor support",
          "Current funding terms",
          "Research alignment",
          "Current admission requirements"
        ],
        "evidenceBasis": "The key uncertainty is Computer Engineering → CS-course equivalency and supervisor support, not GPA alone.",
        "advantages": [
          "Funded research orientation",
          "ML/systems coursework",
          "Potential value proposition"
        ],
        "tradeoffs": [
          "Thesis and supervisor dependency",
          "Winnipeg location decision",
          "Less suitable for a purely professional master’s"
        ],
        "lastVerified": "2026-08-12",
        "source": {
          "name": "University of Manitoba — Computer Science MSc",
          "url": "https://umanitoba.ca/graduate-studies/admissions/programs-of-study/computer-science-msc"
        }
      },
      {
        "id": "windsor-mac-ai",
        "classification": "PROFESSIONAL / APPLIED / INTERNSHIP COMPARISON",
        "university": "University of Windsor",
        "programName": "Master of Applied Computing, Artificial Intelligence Stream",
        "credential": "MAC",
        "routes": [
          "Professional",
          "Approved work-placement internship",
          "Supervised project if placement is unavailable in exceptional cases"
        ],
        "specialization": "Artificial Intelligence Stream",
        "campus": "Windsor",
        "mode": "In person",
        "normalLength": "4 consecutive terms / 16 months in current snapshot",
        "intakes": "September or January in current snapshot; reverify.",
        "dliNumber": "NEEDS REVALIDATION",
        "dliCampusMatch": "NEEDS REVALIDATION",
        "pgwpByCampus": "Exact current program and campus implications require official decision-time verification.",
        "campusRouteAvailability": "Verify exact stream and internship structure for the application cycle.",
        "admissionLanguage": "Reverify current graduate admission requirements.",
        "pgwpLanguage": "Current federal degree-graduate rule: CLB 7 / NCLC 7 in all four abilities.",
        "currentCost": "Self-funded professional program; refresh full tuition and Windsor living-cost baseline.",
        "funding": "Current snapshot says normal GA positions and university scholarships are unavailable for MAC students.",
        "experience": "Approved work-placement internship is built into the route, but placement is not absolutely guaranteed.",
        "research": "Applied professional orientation with less research depth than thesis alternatives.",
        "competitiveness": "REALISTIC",
        "assessmentConfidence": "PROVISIONAL / NEEDS VERIFICATION",
        "keyVerification": [
          "Current transcript",
          "Computer Engineering related-discipline confirmation",
          "Required core CS coursework",
          "Current program and internship requirements"
        ],
        "evidenceBasis": "A related engineering background plus serious software/project evidence is directionally compatible, but core-CS review and high application volume create uncertainty.",
        "advantages": [
          "Professional orientation",
          "Explicit AI stream",
          "Internship component",
          "Employment-transition focus"
        ],
        "tradeoffs": [
          "Self-funded",
          "Less research depth",
          "No normal GA/scholarship support",
          "Internship placement not guaranteed"
        ],
        "lastVerified": "2026-08-12",
        "source": {
          "name": "University of Windsor — MAC Artificial Intelligence Stream",
          "url": "https://www.future.uwindsor.ca/program/master-of-applied-computing-mac-artificial-intelligence-stream/"
        }
      }
    ]
  },
  "lakehead": {
    "classification": "REALISTIC OPTION / PERSONAL SIGNIFICANCE",
    "decisionRule": "Treat relationship and personal value as legitimate, separate inputs. They are neither dismissible nor automatically decisive, and they create no inferred immigration status.",
    "routeTradeoff": [
      {
        "route": "AI thesis specialization",
        "value": "Explicit AI/research alignment",
        "constraint": "Currently no co-op option"
      },
      {
        "route": "Eligible Project / regular Thesis",
        "value": "Potential co-op access; AI work may still be possible",
        "constraint": "Depends on courses, project, supervisor and exact route"
      }
    ],
    "campuses": [
      {
        "id": "lakehead-thunder-bay",
        "campus": "Thunder Bay",
        "programAvailability": "MSc Computer Science is listed in current official program information.",
        "dliNumber": "O19396019447",
        "dliCampusMatch": "VERIFIED",
        "pgwpByCampus": "Current official IRCC evidence located. Exact program-level PGWP eligibility must still be revalidated before commitment.",
        "campusRouteAvailability": "Use current Lakehead official information for the exact Thunder Bay route being evaluated.",
        "officialCampusSource": {
          "name": "IRCC DLI information + Lakehead program documentation",
          "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html"
        },
        "lastVerified": "2026-08-12"
      },
      {
        "id": "lakehead-barrie",
        "campus": "Barrie STEM Hub",
        "programAvailability": "Listed on the current Lakehead program page.",
        "dliNumber": "UNVERIFIED",
        "dliCampusMatch": "UNVERIFIED",
        "pgwpByCampus": "REQUIRES CAMPUS-SPECIFIC OFFICIAL VERIFICATION",
        "campusRouteAvailability": "Do not inherit Thunder Bay Course / Project / Thesis / AI specialization / co-op assumptions. Verify the exact routes offered at Barrie.",
        "officialCampusSource": {
          "name": "Requires campus-specific IRCC and Lakehead verification",
          "url": "https://www.lakeheadu.ca/programs/graduate/programs/masters/computer-science"
        },
        "lastVerified": "2026-08-12 for program-page listing; DLI/PGWP campus match remains unverified.",
        "action": "Recheck official IRCC DLI and Lakehead campus/program documentation before relying on Barrie. UNVERIFIED does not mean ineligible."
      }
    ]
  },
  "locationAnalysis": {
    "location": "Thunder Bay",
    "distinctFrom": "Lakehead University",
    "question": "If Thunder Bay has a smaller technology market, can that disadvantage reasonably be offset by university opportunity, remote work, networking, internships and future relocation?",
    "status": "OPEN RESEARCH QUESTION — DO NOT PRE-ANSWER",
    "research": [
      "Local software market",
      "AI/ML opportunities",
      "Major employers",
      "Internships",
      "Startup ecosystem",
      "Research ecosystem",
      "Networking",
      "Remote-work practicality",
      "Living cost",
      "Transportation",
      "Geographic isolation",
      "Access to larger Canadian technology hubs",
      "Northern Ontario-specific advantages or constraints"
    ]
  },
  "languageStrategy": [
    {
      "purpose": "University admission",
      "summary": "Program-specific evidence used for admission.",
      "questions": [
        "Which tests are currently accepted?",
        "What score does this exact program require?",
        "Can prior English-medium study qualify under the current rule?",
        "When does the evidence expire?"
      ],
      "revalidate": "Before applications and whenever the program changes its requirements."
    },
    {
      "purpose": "PGWP",
      "summary": "A separate federal post-graduation requirement.",
      "questions": [
        "Which tests are accepted under current federal rules?",
        "What CLB/NCLC result is required?",
        "When should the test be booked?",
        "Will the result remain valid at PGWP application?"
      ],
      "revalidate": "Before choosing a test and again before PGWP application."
    },
    {
      "purpose": "Immigration / PR",
      "summary": "Pathway-specific language evidence that may differ from admission and PGWP.",
      "questions": [
        "Which pathway is actually being evaluated?",
        "Which language system and validity period applies then?",
        "Could French-language ability create supplementary optionality?"
      ],
      "revalidate": "Only when an actual pathway becomes strategically relevant."
    }
  ],
  "finances": {
    "published": {
      "title": "Current published cost — August 2026",
      "status": "2026–27 ORIENTATION, NOT 2028 COST",
      "items": [
        "Lakehead international MSc CS tuition: CAD 8,708.33 per term",
        "Ancillary fees: CAD 257.43 per term",
        "Published total: CAD 8,965.76 per term",
        "Books / supplies estimate on fee page: CAD 200",
        "Thunder Bay residence, eight months: CAD 8,562 without meal plan to CAD 14,204.16 with single room + meal plan",
        "UHIP for a September 2026 start: CAD 948 for 12 months"
      ],
      "lastVerified": "2026-08-12"
    },
    "studyPermitReference": "CAD 22,895 is the current IRCC first-year living-expense evidence threshold for one applicant outside Quebec. It excludes tuition and transportation and must not be relabelled as actual living expenses.",
    "future": {
      "title": "Estimated future cost",
      "items": [
        "Tuition and compulsory fees",
        "Actual housing and food",
        "Insurance / UHIP",
        "Books and technology",
        "Local transport and flights",
        "Permit and biometric costs",
        "Winter clothing, deposits and initial setup",
        "Emergency reserve",
        "Exchange-rate movement"
      ],
      "status": "Scenario estimate only — keep separate from published figures"
    },
    "horizon": {
      "title": "2028 cost",
      "status": "UNKNOWN / MUST BE REVALIDATED",
      "trigger": "Before shortlisting becomes financially actionable, refresh tuition, fees, housing, insurance, proof-of-funds rules and CAD/INR assumptions."
    },
    "resourceClasses": [
      "Guaranteed resources",
      "Probable resources",
      "Possible income",
      "Speculative income"
    ],
    "guardrail": "Core affordability must not depend on speculative student employment, internship income or remote work."
  },
  "canadaRequirements": {
    "programIdentityRule": "DLI and PGWP information belongs to the exact campus + exact program + exact credential + exact route. University-level information never propagates automatically.",
    "beforeCommitment": [
      "Exact program identity and campus",
      "DLI campus match",
      "Current exact-program PGWP implications",
      "Program route and co-op/research availability",
      "Current tuition, fees, funding and full cost",
      "Admission documents and language requirements",
      "Current study-permit requirements and PAL/TAL position",
      "Current financial-support evidence",
      "Current work and co-op conditions"
    ],
    "workEvidenceRule": "Career value and immigration treatment are different questions. Internships, freelancing, co-op, foreign work, Canadian work, remote work and student work must not be treated as equivalent for immigration purposes.",
    "remoteWorkRule": "Remote work belongs primarily in Career Opportunities, not assumed Canada funding. If work is performed while physically in Canada, revalidate permit conditions, classification, tax and pathway treatment."
  },
  "immigrationReference": {
    "title": "Pathways to research",
    "status": "CURRENT-RULE DEPENDENT — REFERENCES, NOT PROMISES",
    "summary": "Do not implement or infer “Master’s → PGWP → Job → PR.” Research the system that exists when a decision becomes actionable.",
    "categories": [
      "Federal programs",
      "Canadian Experience Class",
      "Federal Skilled Worker",
      "Provincial programs",
      "Ontario programs",
      "Graduate pathways",
      "Occupation or category-based pathways",
      "Employer-linked options",
      "French-language opportunities",
      "Future successor programs"
    ],
    "cardQuestions": [
      "What is this?",
      "Why could it matter?",
      "When does it become relevant?",
      "What must be verified then?",
      "What is the official source and last verification date?"
    ],
    "guardrail": "Technical skills are selected primarily for career value, market demand, foundations, interest, differentiation and durability—not temporary immigration incentives."
  },
  "checkpoints": [
    {
      "name": "Early research",
      "trigger": "Directional only.",
      "verify": [
        "Broad education route",
        "Country and life optionality",
        "Career independence"
      ]
    },
    {
      "name": "University shortlist becomes real",
      "trigger": "When realistic programs deserve deeper comparison.",
      "verify": [
        "Exact program, route and campus",
        "Admission fit and assessment evidence",
        "Cost and funding",
        "Co-op, research and career value",
        "Current policy metadata"
      ]
    },
    {
      "name": "Before applications",
      "trigger": "Before spending application time and fees.",
      "verify": [
        "Deadlines and intakes",
        "Admission language",
        "Funding",
        "References and SOP materials",
        "Current immigration context"
      ]
    },
    {
      "name": "Before accepting offer",
      "trigger": "Before a major financial commitment.",
      "verify": [
        "Total cost and downside cases",
        "Program and location value",
        "Exact-program PGWP implications",
        "DLI/program status",
        "Funding and current immigration rules"
      ]
    },
    {
      "name": "Before study permit",
      "trigger": "When an offer is accepted and the permit becomes actionable.",
      "verify": [
        "Every permit document",
        "PAL/TAL position",
        "Financial-support requirements",
        "Current work conditions"
      ]
    },
    {
      "name": "Before travel",
      "trigger": "After permit approval and before entering Canada.",
      "verify": [
        "Permit conditions",
        "Work rights",
        "Insurance, housing and arrival finances"
      ]
    },
    {
      "name": "During study",
      "trigger": "When work, co-op, program or status changes.",
      "verify": [
        "Study-status compliance",
        "Work and co-op conditions",
        "Program-change implications"
      ]
    },
    {
      "name": "Before graduation / PGWP",
      "trigger": "When post-graduation action is near.",
      "verify": [
        "Ignore stored assumptions",
        "Fresh federal PGWP rules",
        "Language result and validity",
        "Completion and application documents"
      ]
    },
    {
      "name": "Before PR strategy",
      "trigger": "Only when a real immigration strategy is needed.",
      "verify": [
        "The federal and provincial system that actually exists",
        "Treatment of exact work evidence",
        "Downside and geographic options"
      ]
    }
  ],
  "canadaTrajectory": [
    {
      "period": "2026 · current reference",
      "title": "Early directional research only",
      "detail": "Keep the verified snapshot compact. Professional SWE foundations and project quality remain the primary work."
    },
    {
      "period": "2027 · possible",
      "title": "Education options may become more concrete",
      "detail": "Refresh transcript fit, program routes, research interests and finances only as the decision becomes real."
    },
    {
      "period": "2028+ · non-binding",
      "title": "Applications, decisions or transition only if still justified",
      "detail": "Fall 2028 is one possible intake. Replace this broad horizon with verified program-specific intakes and deadlines when actionable."
    },
    {
      "period": "During study · if Canada happens",
      "title": "Maintain career and policy independence",
      "detail": "Build professional value while revalidating work, program and compliance conditions at decision triggers."
    },
    {
      "period": "Before graduation / future strategy",
      "title": "Use the rules that actually exist then",
      "detail": "Freshly verify PGWP and any immigration pathways. No outcome is guaranteed by the degree."
    }
  ],
  "valueDimensions": [
    "Career Value",
    "Portfolio Value",
    "Network Value",
    "Education Value",
    "Financial Value",
    "Canada Value",
    "Immigration Value",
    "Personal / Life Value"
  ],
  "globalGuardrail": "When career and immigration incentives disagree, evaluate career capital, financial resilience, life value, geographic optionality and immigration optionality. Never weaken long-term engineering capability for a temporary policy advantage."
};

  const trajectory = [
  {
    "period": "Aug 2026 · now",
    "title": "Capable software builder + early production contributor",
    "detail": "Focus on Software Engineering Core and authentic production-grade evidence."
  },
  {
    "period": "Late 2026 · reference",
    "title": "Stronger professional SWE foundations",
    "detail": "A serious engineered repository, stronger interview readiness and math verification may be visible."
  },
  {
    "period": "Early 2027 · reference",
    "title": "Classical ML + evaluated ML system",
    "detail": "A high-quality Project 2 may demonstrate rigorous ML reasoning."
  },
  {
    "period": "Mid 2027 · reference",
    "title": "ML engineering and deployment depth",
    "detail": "Project 3 may expand opportunity overlap if the evidence is strong."
  },
  {
    "period": "Late 2027 · reference",
    "title": "PyTorch, deep learning + LLM foundations",
    "detail": "Project 4 should include genuine model training/fine-tuning, evaluation and debugging."
  },
  {
    "period": "Around Feb 2028 · reference",
    "title": "Strong SWE / ML engineering profile",
    "detail": "Potential early production-AI evidence near current expected B.Tech completion."
  },
  {
    "period": "2028 onward · reference",
    "title": "Production AI + validated specialization",
    "detail": "Work and/or optional graduate study; Project 5 informs the specialization decision."
  }
];

  const evidenceTypes = ['Resume','GitHub repository','Production PR','Live application','Deployed system','Project artifact','Benchmark / evaluation','Work experience','Course + project evidence','Diagnostic','Open-source contribution','Other'];

  window.ATLAS_DATA = {
    roadmapVersion: '2.4.0',
    stateVersion: 2,
    lastPlanVerification: '15 Aug 2026',
    status: STATUS,
    statusLabels,
    progressLabels,
    evidenceTypes,
    currentPosition: {
      stage: 'Software Engineering Core',
      identity: 'Capable software builder + early production contributor',
      foundation: 'React/TypeScript, Python applications, Git/PR workflow, production contribution, pandas/EDA and local LLM systems.',
      mainGap: 'Production engineering depth: systematic testing, backend/database depth, Docker, CI/CD, deployment, security and observability.',
      nextMove: 'Inspect and harden the best existing application into convincing production-engineering evidence.',
      ignoreNow: 'Beginner Python/React/pandas, arbitrary project counts, Kubernetes, CS336, random RAG chatbots, daily social quotas and calendar-driven mastery.',
      evidenceAudit: [
        {name:'Programming fundamentals',status:'already-proven',basis:'CS50 + multiple working applications'},
        {name:'JavaScript / TypeScript / React',status:'already-proven',basis:'Multiple applications + production frontend work'},
        {name:'Python application development',status:'already-proven',basis:'Flask, FastAPI, local AI and pandas systems'},
        {name:'Team software workflow',status:'already-proven',basis:'Jira → branch → PR → review / QA work'},
        {name:'Production Git / PR workflow',status:'likely-proven',basis:'Attach one representative real PR to verify once'},
        {name:'pandas / introductory EDA',status:'already-proven',basis:'Financial EDA + Kaggle visualization artifacts'},
        {name:'Local LLM inference',status:'already-proven',basis:'Local Qwen 4B / 8B systems'},
        {name:'Backend + API engineering',status:'partial',basis:'Flask, FastAPI, Supabase / Edge Functions; deepen ownership'},
        {name:'Relational databases',status:'partial',basis:'Postgres + SQLite; deepen transactions, indexes and plans'},
        {name:'Systematic testing',status:'missing',basis:'Insufficient inspectable evidence'},
        {name:'Docker + basic CI',status:'missing',basis:'No strong current artifact'},
        {name:'Cloud + operations',status:'partial',basis:'Deployment exposure; systematic infrastructure proof missing'}
      ]
    },
    architecture: ['Current engineering foundation','Software Engineering Core','Math + Data','Classical ML','ML Engineering','Deep Learning','LLM / GenAI Systems','Production AI','Specialization'],
    phases,
    sweDepth,
    youtubeLearning,
    aiNativeEngineering,
    orientationVideos,
    taskResourceContext,
    glossary,
    projects,
    roles,
    opportunities,
    internshipChecklist,
    discoveryStack,
    experience,
    education,
    trajectory,
    resources,
    proofLoop: ['Learn','Implement','Build / improve','Test','Measure','Document','Publish evidence','Opportunities'],
    marketMatrix: {
      foundational: ['Programming','Testing/debugging','Git/PR workflow'],
      common: ['HTTP/APIs','SQL/databases','Docker','CI/CD','Cloud','Observability','Security'],
      roleDependent: ['PyTorch/DL','Retrieval/RAG','Agents/MCP','Distributed training','GPU kernels']
    },
    projectOneCandidateCriteria: ['Real engineering surface area','Engineering ownership','Production-depth opportunity','Database/backend depth','Realistic complexity','Portfolio value'],
    notNow: ['Kubernetes','Terraform','Spark','Kafka','Ray','Airflow','Every vector database','Every agent framework','Distributed GPU training','CUDA/Triton kernels','FSDP/DeepSpeed','RLHF/DPO implementation','Large-scale pretraining','Multimodal/RL/CV specialization'],
    sourcePrecedence: ['Newest Canada micro-corrections','Seven approved Canada patches','Education / Canada Master Layer','Two Career micro-corrections','Five Career patches','Original Career Architecture v2','Old ATLAS content']
  };
})();
