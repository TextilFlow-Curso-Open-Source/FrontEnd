
workspace "TextilFlow Frontend" "Component diagram showing all bounded contexts within the Single Page Application" {

  model {
    # People
    distributor = person "Distributor" "Person who distributes and sends fabric batches to textile companies"
    businessOwner = person "Business Owner" "Person who receives and evaluates the quality of fabric batches"
    visitor = person "Visitor" "Person who explores the landing page to learn about the solution"

    # Main System and Containers
    textilFlow = softwareSystem "TextilFlow" "Platform for traceability and quality control in the textile industry" {

      webApplication = container "Web Application" "Delivers static content and the Angular Single Page Application (SPA)" "HTML, CSS, Angular CLI" "WebApp"

      singlePageApp = container "Single Page Application" "Runs in the browser and provides all user functionality via API calls" "Angular, TypeScript" "SPA" {

        # Auth Bounded Context Components
        authBC = component "Auth Bounded Context" "Authentication and role management functionality" "Angular Module" "BoundedContext"
        userLoginComponent = component "UserLoginComponent" "Login form component" "Angular Component" "AuthComponent"
        userRegisterComponent = component "UserRegisterComponent" "Registration form component" "Angular Component" "AuthComponent"
        userRoleSelectorComponent = component "UserRoleSelectorComponent" "Role selection component" "Angular Component" "AuthComponent"
        forgotPasswordComponent = component "ForgotPasswordComponent" "Password recovery component" "Angular Component" "AuthComponent"
        authService = component "AuthService" "Authentication service" "Angular Service" "AuthService"
        sessionService = component "SessionService" "Session management service" "Angular Service" "AuthService"
        userModel = component "User Model" "User domain entity" "TypeScript Class" "AuthModel"

        # Batch Bounded Context Components
        batchBC = component "Batch Bounded Context" "Batch management and processing functionality" "Angular Module" "BoundedContext"
        businessmanBatchComponent = component "BusinessmanBatchComponent" "Businessman batch management UI" "Angular Component" "BatchComponent"
        supplierBatchComponent = component "SupplierBatchComponent" "Supplier batch viewing UI" "Angular Component" "BatchComponent"
        supplierRegisterBatchComponent = component "SupplierRegisterBatchComponent" "Batch registration UI" "Angular Component" "BatchComponent"
        batchService = component "BatchService" "Batch business logic service" "Angular Service" "BatchService"
        batchModel = component "Batch Model" "Batch domain entity" "TypeScript Class" "BatchModel"
        batchRequestModel = component "BatchRequest Model" "Batch request domain entity" "TypeScript Class" "BatchModel"

        # Businessman Bounded Context Components
        businessmanBC = component "Businessman Bounded Context" "Businessman specific functionality" "Angular Module" "BoundedContext"
        businessmanHomeComponent = component "BusinessmanHomeComponent" "Businessman dashboard" "Angular Component" "BusinessmanComponent"
        businessmanPlansComponent = component "BusinessmanPlansComponent" "Plans management UI" "Angular Component" "BusinessmanComponent"
        businessmanRequestComponent = component "BusinessmanRequestComponent" "Request management UI" "Angular Component" "BusinessmanComponent"
        businessmanLayoutComponent = component "BusinessmanLayoutComponent" "Layout wrapper component" "Angular Component" "BusinessmanComponent"
        businessmanService = component "BusinessmanService" "Businessman business logic" "Angular Service" "BusinessmanService"
        businessmanModel = component "Businessman Model" "Businessman domain entity" "TypeScript Class" "BusinessmanModel"

        # Supplier Bounded Context Components
        supplierBC = component "Supplier Bounded Context" "Supplier specific functionality" "Angular Module" "BoundedContext"
        supplierHomeComponent = component "SupplierHomeComponent" "Supplier dashboard" "Angular Component" "SupplierComponent"
        supplierPlansComponent = component "SupplierPlansComponent" "Plans management UI" "Angular Component" "SupplierComponent"
        supplierRequestComponent = component "SupplierRequestComponent" "Request management UI" "Angular Component" "SupplierComponent"
        supplierLayoutComponent = component "SupplierLayoutComponent" "Layout wrapper component" "Angular Component" "SupplierComponent"
        supplierService = component "SupplierService" "Supplier business logic" "Angular Service" "SupplierService"
        supplierReviewService = component "SupplierReviewService" "Review management service" "Angular Service" "SupplierService"
        supplierModel = component "Supplier Model" "Supplier domain entity" "TypeScript Class" "SupplierModel"
        supplierReviewModel = component "SupplierReview Model" "Review domain entity" "TypeScript Class" "SupplierModel"

        # Configuration Bounded Context Components
        configurationBC = component "Configuration Bounded Context" "User configuration and preferences" "Angular Module" "BoundedContext"
        businessmanConfigurationComponent = component "BusinessmanConfigurationComponent" "Businessman config UI" "Angular Component" "ConfigurationComponent"
        businessmanProfileConfigurationComponent = component "BusinessmanProfileConfigurationComponent" "Profile config UI" "Angular Component" "ConfigurationComponent"
        supplierConfigurationComponent = component "SupplierConfigurationComponent" "Supplier config UI" "Angular Component" "ConfigurationComponent"
        supplierProfileConfigurationComponent = component "SupplierProfileConfigurationComponent" "Supplier profile config UI" "Angular Component" "ConfigurationComponent"
        configurationService = component "ConfigurationService" "Configuration management service" "Angular Service" "ConfigurationService"
        configurationModel = component "Configuration Model" "Configuration domain entity" "TypeScript Class" "ConfigurationModel"

        # Observation Bounded Context Components
        observationBC = component "Observation Bounded Context" "Quality control observations functionality" "Angular Module" "BoundedContext"
        businessmanObservationComponent = component "BusinessmanObservationComponent" "Businessman observation UI" "Angular Component" "ObservationComponent"
        supplierObservationComponent = component "SupplierObservationComponent" "Supplier observation UI" "Angular Component" "ObservationComponent"
        observationService = component "ObservationService" "Observation business logic" "Angular Service" "ObservationService"
        observationModel = component "Observation Model" "Observation domain entity" "TypeScript Class" "ObservationModel"

        # Request Bounded Context Components
        requestBC = component "Request Bounded Context" "Connection requests between users" "Angular Module" "BoundedContext"
        addSupplierComponent = component "AddSupplierComponent" "Add supplier UI" "Angular Component" "RequestComponent"
        businessRequestComponent = component "BusinessRequestComponent" "Business request UI" "Angular Component" "RequestComponent"
        supplierRequestService = component "SupplierRequestService" "Request management service" "Angular Service" "RequestService"
        businessSupplierRequestModel = component "BusinessSupplierRequest Model" "Request domain entity" "TypeScript Class" "RequestModel"

        # Shared/Core Context Components
        sharedBC = component "Shared/Core Context" "Reusable services and components" "Angular Module" "SharedContext"
        appButtonComponent = component "AppButtonComponent" "Reusable button component" "Angular Component" "SharedComponent"
        smartLogoComponent = component "SmartLogoComponent" "Logo component" "Angular Component" "SharedComponent"
        themeSwitcherComponent = component "ThemeSwitcherComponent" "Theme switcher UI" "Angular Component" "SharedComponent"
        appInputComponent = component "AppInputComponent" "Reusable input component" "Angular Component" "SharedComponent"
        appNotificationComponent = component "AppNotificationComponent" "Notification component" "Angular Component" "SharedComponent"
        pageNotFoundComponent = component "PageNotFoundComponent" "404 error page" "Angular Component" "SharedComponent"
        themeService = component "ThemeService" "Theme management service" "Angular Service" "SharedService"
        baseService = component "BaseService<T>" "Generic base service class" "Angular Service" "SharedService"
      }

      apiApplication = container "API Application" "Monolithic modular backend that exposes a REST API to the SPA" "Spring Boot, Java" "API"
      database = container "Database" "Stores users, batches, observations, etc." "Oracle Database" "Database"
    }

    # Person-to-Container Relationships
    visitor -> webApplication "Visits public landing page"
    distributor -> singlePageApp "Uses the system via the SPA"
    businessOwner -> singlePageApp "Uses the system via the SPA"

    # Container-to-Container Relationships
    webApplication -> singlePageApp "Delivers the Angular SPA to the browser"
    singlePageApp -> apiApplication "Sends JSON/HTTPS requests to" "REST API"
    apiApplication -> database "Reads from and writes to" "JPA/Hibernate"

    # Component Relationships within Auth BC
    userLoginComponent -> authService "Uses for authentication"
    userRegisterComponent -> authService "Uses for registration"
    userRoleSelectorComponent -> authService "Uses for role selection"
    forgotPasswordComponent -> authService "Uses for password recovery"
    authService -> sessionService "Manages user sessions"
    authService -> userModel "Works with user data"

    # Component Relationships within Batch BC
    businessmanBatchComponent -> batchService "Uses for batch operations"
    supplierBatchComponent -> batchService "Uses for batch viewing"
    supplierRegisterBatchComponent -> batchService "Uses for batch registration"
    batchService -> batchModel "Works with batch data"
    batchService -> batchRequestModel "Works with batch requests"

    # Component Relationships within Businessman BC
    businessmanHomeComponent -> businessmanService "Uses for businessman operations"
    businessmanPlansComponent -> businessmanService "Uses for plans management"
    businessmanRequestComponent -> businessmanService "Uses for request management"
    businessmanService -> businessmanModel "Works with businessman data"

    # Component Relationships within Supplier BC
    supplierHomeComponent -> supplierService "Uses for supplier operations"
    supplierPlansComponent -> supplierService "Uses for plans management"
    supplierRequestComponent -> supplierService "Uses for request management"
    supplierRequestComponent -> supplierReviewService "Uses for review management"
    supplierService -> supplierModel "Works with supplier data"
    supplierReviewService -> supplierReviewModel "Works with review data"

    # Component Relationships within Configuration BC
    businessmanConfigurationComponent -> configurationService "Uses for configuration"
    businessmanProfileConfigurationComponent -> configurationService "Uses for profile config"
    supplierConfigurationComponent -> configurationService "Uses for configuration"
    supplierProfileConfigurationComponent -> configurationService "Uses for profile config"
    configurationService -> configurationModel "Works with configuration data"
    businessmanConfigurationComponent -> themeService "Uses for theme management"
    supplierConfigurationComponent -> themeService "Uses for theme management"

    # Component Relationships within Observation BC
    businessmanObservationComponent -> observationService "Uses for observation management"
    supplierObservationComponent -> observationService "Uses for observation viewing"
    observationService -> observationModel "Works with observation data"

    # Component Relationships within Request BC
    addSupplierComponent -> supplierRequestService "Uses for request creation"
    businessRequestComponent -> supplierRequestService "Uses for request management"
    supplierRequestService -> businessSupplierRequestModel "Works with request data"

    # Cross-Bounded Context Dependencies
    batchService -> authService "Uses for authentication"
    businessmanService -> authService "Uses for authentication"
    supplierService -> authService "Uses for authentication"
    configurationService -> authService "Uses for authentication"
    observationService -> authService "Uses for authentication"
    supplierRequestService -> authService "Uses for authentication"
    businessmanBatchComponent -> observationService "Uses for observations"
  }

  views {
    container textilFlow "TextilFlowContainers" "Container Diagram of TextilFlow" {
      include *
      exclude "element.tag==BoundedContext,element.tag==SharedContext,element.tag==AuthComponent,element.tag==BatchComponent,element.tag==BusinessmanComponent,element.tag==SupplierComponent,element.tag==ConfigurationComponent,element.tag==ObservationComponent,element.tag==RequestComponent,element.tag==SharedComponent"
      autoLayout tb
    }

    component singlePageApp "SPABoundedContexts" "All Bounded Contexts within the Single Page Application" {
      include authBC batchBC businessmanBC supplierBC configurationBC observationBC requestBC sharedBC
      autoLayout tb 400 200
    }

    # Individual Bounded Context Component Diagrams (Drill-down)
    component singlePageApp "AuthBoundedContextDetail" "Detailed view of Auth Bounded Context components" {
      include authBC userLoginComponent userRegisterComponent userRoleSelectorComponent forgotPasswordComponent authService sessionService userModel
      autoLayout tb 300 150
    }

    component singlePageApp "BatchBoundedContextDetail" "Detailed view of Batch Bounded Context components" {
      include batchBC businessmanBatchComponent supplierBatchComponent supplierRegisterBatchComponent batchService batchModel batchRequestModel
      autoLayout tb 300 150
    }

    component singlePageApp "BusinessmanBoundedContextDetail" "Detailed view of Businessman Bounded Context components" {
      include businessmanBC businessmanHomeComponent businessmanPlansComponent businessmanRequestComponent businessmanLayoutComponent businessmanService businessmanModel
      autoLayout tb 300 150
    }

    component singlePageApp "SupplierBoundedContextDetail" "Detailed view of Supplier Bounded Context components" {
      include supplierBC supplierHomeComponent supplierPlansComponent supplierRequestComponent supplierLayoutComponent supplierService supplierReviewService supplierModel supplierReviewModel
      autoLayout tb 300 150
    }

    component singlePageApp "ConfigurationBoundedContextDetail" "Detailed view of Configuration Bounded Context components" {
      include configurationBC businessmanConfigurationComponent businessmanProfileConfigurationComponent supplierConfigurationComponent supplierProfileConfigurationComponent configurationService configurationModel
      autoLayout tb 300 150
    }

    component singlePageApp "ObservationBoundedContextDetail" "Detailed view of Observation Bounded Context components" {
      include observationBC businessmanObservationComponent supplierObservationComponent observationService observationModel
      autoLayout tb 300 150
    }

    component singlePageApp "RequestBoundedContextDetail" "Detailed view of Request Bounded Context components" {
      include requestBC addSupplierComponent businessRequestComponent supplierRequestService businessSupplierRequestModel
      autoLayout tb 300 150
    }

    component singlePageApp "SharedBoundedContextDetail" "Detailed view of Shared/Core components and services" {
      include sharedBC appButtonComponent smartLogoComponent themeSwitcherComponent appInputComponent appNotificationComponent pageNotFoundComponent themeService baseService
      autoLayout tb 300 150
    }

    styles {
      element "Person" {
        shape "Person"
        background "#2A1905"
        color "#ffffff"
      }
      element "Distributor" {
        background "#866C52"
      }
      element "BusinessOwner" {
        background "#866C52"
      }
      element "Visitor" {
        background "#C19A6B"
      }
      element "Software System" {
        background "#1A6B54"
        color "#ffffff"
      }
      element "Container" {
        background "#438d7e"
        color "#ffffff"
      }
      element "WebApp" {
        shape "WebBrowser"
        background "#66A699"
      }
      element "SPA" {
        shape "WebBrowser"
        background "#3E8C84"
      }
      element "API" {
        background "#0D3D30"
      }
      element "Database" {
        shape "Cylinder"
        background "#E8E2E2"
        color "#000000"
      }

      # Bounded Context Styles
      element "BoundedContext" {
        background "#FF6B6B"
        color "#ffffff"
        shape "RoundedBox"
      }
      element "SharedContext" {
        background "#96CEB4"
        color "#000000"
        shape "RoundedBox"
      }

      # Component Styles by Type
      element "Component" {
        background "#E1F5FE"
        color "#000000"
        shape "RoundedBox"
      }
      element "AuthComponent" {
        background "#FFCDD2"
        color "#000000"
      }
      element "BatchComponent" {
        background "#F3E5F5"
        color "#000000"
      }
      element "BusinessmanComponent" {
        background "#E8F5E8"
        color "#000000"
      }
      element "SupplierComponent" {
        background "#FFF3E0"
        color "#000000"
      }
      element "ConfigurationComponent" {
        background "#E3F2FD"
        color "#000000"
      }
      element "ObservationComponent" {
        background "#FFF8E1"
        color "#000000"
      }
      element "RequestComponent" {
        background "#F1F8E9"
        color "#000000"
      }
      element "SharedComponent" {
        background "#FAFAFA"
        color "#000000"
      }
    }
  }
}
