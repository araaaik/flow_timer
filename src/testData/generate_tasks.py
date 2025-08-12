import csv
import datetime
import random

task_names = [
    "Update project", "Configure cloud", "Develop frontend", "Analyze user", "Tune PostgreSQL",
    "Process data", "Ensure application", "Develop authentication", "Prometheus monitoring", "Analyze server",
    "Kubernetes cluster", "Develop AI", "CI/CD pipeline", "Build Telegram", "Monitor performance",
    "Develop mobile", "Configure Redis", "Develop microservice", "Integrate with", "Deploy Docker",
    "Test REST", "Implement push", "Create reporting", "Integrate with", "Write unit",
    "Migrate database", "Scrape data", "Maintain legacy", "Refactor code", "Optimize SQL",
    "Create reporting", "Refactor code", "Develop microservice", "Analyze server", "Prometheus monitoring",
    "Ensure application", "Configure cloud", "Optimize SQL", "Write unit", "Update project",
    "Develop AI", "Develop mobile", "Migrate database", "Deploy Docker", "Tune PostgreSQL",
    "Integrate with", "Build Telegram", "Kubernetes cluster", "Scrape data", "CI/CD pipeline",
    "Develop frontend", "Analyze user", "Test REST", "Implement push", "Integrate with",
    "Process data", "Monitor performance", "Configure Redis", "Maintain legacy", "Develop authentication",
    "Test REST", "Write unit", "Migrate database", "Process data", "Build Telegram",
    "Process data", "Develop microservice", "Configure Redis", "Kubernetes cluster", "Develop AI",
    "Implement push", "Integrate with", "Create reporting", "Analyze user", "Configure cloud",
    "Develop frontend", "Analyze server", "Integrate with", "Update project", "Kubernetes cluster",
    "Optimize SQL", "Deploy Docker", "Migrate database", "Develop AI", "Analyze server",
    "Develop mobile", "Ensure application", "Develop authentication", "Tune PostgreSQL", "Deploy Docker",
    "Monitor performance", "Prometheus monitoring", "Write unit", "Refactor code", "Refactor code",
    "Update project", "Monitor performance", "Develop frontend", "Create reporting", "Ensure application",
    "Prometheus monitoring", "Test REST", "Integrate with", "Optimize SQL", "Maintain legacy",
    "Develop authentication", "Implement push", "Configure Redis", "Tune PostgreSQL", "Analyze user",
    "Scrape data", "CI/CD pipeline", "Configure cloud", "CI/CD pipeline", "Maintain legacy",
    "Develop microservice", "Integrate with", "Scrape data", "Build Telegram", "Develop mobile",
    "Optimize SQL", "Develop mobile", "Integrate with", "Kubernetes cluster", "Implement push",
    "Deploy Docker", "Prometheus monitoring", "Migrate database", "Optimize SQL", "Refactor code",
    "Refactor code", "Kubernetes cluster", "Create reporting", "Process data", "Migrate database",
    "Monitor performance", "Deploy Docker", "Configure cloud", "Tune PostgreSQL", "Analyze user",
    "Integrate with", "CI/CD pipeline", "Maintain legacy", "Analyze server", "Analyze user",
    "Maintain legacy", "Integrate with", "Prometheus monitoring", "Develop frontend", "Configure Redis",
    "Maintain legacy", "Create reporting", "Implement push", "Update project", "Configure Redis",
    "Develop authentication", "Monitor performance", "Ensure application", "Kubernetes cluster", "Configure cloud",
    "Create reporting", "Scrape data", "Deploy Docker", "Migrate database", "Develop microservice",
    "Process data", "Test REST", "Tune PostgreSQL", "Analyze server", "Integrate with",
    "Build Telegram", "Develop mobile", "Build Telegram", "Develop AI", "Test REST",
    "Scrape data", "Optimize SQL", "Maintain legacy", "Build Telegram", "Kubernetes cluster",
    "Create reporting", "Update project", "Develop frontend", "Write unit", "Configure Redis",
    "Ensure application"
]

def generate_tasks(start_date, end_date, output_file="tasks.csv"):
    current_date = start_date
    with open(output_file, mode='w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)
        csv_writer.writerow(['FLOW Data Export', datetime.datetime.utcnow().isoformat()])
        csv_writer.writerow(['Period', f'{start_date.strftime("%Y-%m-%d")} - {end_date.strftime("%Y-%m-%d")}'])
        csv_writer.writerow([])
        csv_writer.writerow(['SUMMARY'])
        csv_writer.writerow(['Total Sessions', 0])
        csv_writer.writerow(['Total Time', '0:00:00'])
        csv_writer.writerow(['Unique Tasks', 0])
        csv_writer.writerow(['Average Session Time', '0:00:00'])
        csv_writer.writerow(['Longest Session', '0:00:00'])
        csv_writer.writerow([])
        csv_writer.writerow(['DETAILED DATA'])
        csv_writer.writerow(['Date', 'Task', 'Duration (sec)', 'Duration (time)'])

        while current_date <= end_date:
            total_duration = 0
            num_tasks = 0
            tasks_for_day = []
            
            # randomize total duration between 4 and 9 hours (240 to 540 minutes)
            target_duration = random.randint(240, 540)
            
            while total_duration < target_duration or num_tasks < 5:
                task_name = random.choice(task_names)
                duration = random.randint(10, 120)  # limit task duration to 2 hours to avoid too few tasks
                
                tasks_for_day.append((task_name, duration))
                total_duration += duration
                num_tasks += 1
                
                if num_tasks > 100:
                    print("exiting")
                    exit()

            # Trim tasks if total duration exceeds the limit
            overtime = total_duration - target_duration
            while overtime > 0:
                task_to_trim_index = random.randint(0, len(tasks_for_day) - 1)
                task_to_trim = tasks_for_day[task_to_trim_index]
                if task_to_trim[1] > overtime:
                    tasks_for_day[task_to_trim_index] = (task_to_trim[0], task_to_trim[1] - overtime)
                    total_duration -= overtime
                    overtime = 0
                else:
                    total_duration -= task_to_trim[1]
                    overtime -= task_to_trim[1]
                    tasks_for_day.pop(task_to_trim_index)
            
            for task, duration in tasks_for_day:
                csv_writer.writerow([
                    current_date.strftime('%Y-%m-%d'),
                    task,
                    duration * 60 + random.randint(0, 59),
                    str(datetime.timedelta(seconds=duration * 60 + random.randint(0, 59)))
                ])

            current_date += datetime.timedelta(days=1)

start_date = datetime.date(2025, 7, 1)
end_date = datetime.date(2025, 8, 10)
generate_tasks(start_date, end_date, "src/testData/tasks.csv")