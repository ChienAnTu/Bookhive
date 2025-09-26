# =====================
# Production (VPS)
# =====================
up: ## Start production containers (detached)
	docker compose -f compose.yaml up -d

down: ## Stop production containers
	docker compose -f compose.yaml down

build: ## Build production containers
	docker compose -f compose.yaml build

logs: ## Show logs (prod)
	docker compose -f compose.yaml logs -f nginx frontend backend


# =====================
# Development (Local)
# =====================
up-dev: ## Start development containers (foreground)
	docker compose -f compose.yaml -f compose.dev.yaml up

down-dev: ## Stop development containers
	docker compose -f compose.yaml -f compose.dev.yaml down

build-dev: ## Build development containers
	docker compose -f compose.yaml -f compose.dev.yaml build

logs-dev: ## Show logs (dev)
	docker compose -f compose.yaml -f compose.dev.yaml logs -f nginx frontend backend


# =====================
# Utilities
# =====================
clean: ## Remove unused Docker data
	docker system prune -f

help: ## Show this help
	@echo ""
	@echo "Available make commands:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-12s %s\n", $$1, $$2}'
	@echo ""
