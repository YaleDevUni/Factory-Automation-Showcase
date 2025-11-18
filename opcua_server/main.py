import asyncio
import random
import math # Import the math module
from asyncua import ua, Server

# 공장 구조 정의
FACTORY_STRUCTURE = {
    "Line1": {
        "Machine1": {
            "speed": (3.0, 7.0),
            "temperature": (20.0, 90.0),
            "pressure": (1.0, 5.0)
        },
        "Machine2": {
            "rpm": (800, 1500),
            "torque": (10, 30)
        }
    },
    "Line2": {
        "Machine3": {
            "flow_rate": (50, 120),
            "vibration": (0.1, 5.0)
        },
        "Machine4": {
            "humidity": (10, 50),
            "temperature": (25, 80)
        }
    }
}


async def create_opcua_server():
    server = Server()
    await server.init()

    server.set_endpoint("opc.tcp://0.0.0.0:4840/factory/")
    server.set_server_name("Multi-Line OPC UA Factory Simulator")

    idx = await server.register_namespace("http://helloworld.com/opcua/factory/")

    # 전체 공장 루트
    factory = await server.nodes.objects.add_object(idx, "Factory")

    # 노드 참조 저장
    node_map = {}
    
    # Sinusoidal simulation parameters
    time_counter = 0
    random_perturbations = {} # Stores a random offset for each property
    random_update_interval = 5 # seconds

    # 구조적으로 OPC UA Node 생성
    for line_name, machines in FACTORY_STRUCTURE.items():
        line_node = await factory.add_object(idx, line_name)
        node_map[line_name] = {}

        for machine_name, props in machines.items():
            machine_node = await line_node.add_object(idx, machine_name)
            node_map[line_name][machine_name] = {}

            for prop_name, (min_v, max_v) in props.items():
                var_node = await machine_node.add_variable(idx, prop_name, 0.0)
                await var_node.set_writable()  # 클라이언트 write 가능
                node_map[line_name][machine_name][prop_name] = (
                    var_node, min_v, max_v)
                # Initialize random perturbation for each property
                random_perturbations[f"{line_name}-{machine_name}-{prop_name}"] = random.uniform(-0.1, 0.1) * (max_v - min_v)


    async with server:
        print("Multi-Line OPC UA Server Running at opc.tcp://localhost:4840/factory")

        while True:
            time_counter += 1
            
            # Update random perturbations every random_update_interval seconds
            if time_counter % random_update_interval == 0:
                for line_name, machines in FACTORY_STRUCTURE.items():
                    for machine_name, props in machines.items():
                        for prop_name, (min_v, max_v) in props.items():
                            random_perturbations[f"{line_name}-{machine_name}-{prop_name}"] = random.uniform(-0.1, 0.1) * (max_v - min_v)

            for line_name, machines in node_map.items():
                for machine_name, props in machines.items():
                    updated_props = []
                    for prop_name, (node, min_v, max_v) in props.items():
                        # Determine amplitude and midpoint for sinusoidal wave
                        amplitude = (max_v - min_v) / 2
                        midpoint = min_v + amplitude

                        # Base sinusoidal value (e.g., using sin for some, cos for others)
                        base_value = 0.0
                        if prop_name == "speed" or prop_name == "rpm" or prop_name == "flow_rate":
                            base_value = midpoint + amplitude * math.sin(time_counter * 0.1 + random.uniform(-0.5, 0.5))
                        elif prop_name == "temperature" or prop_name == "pressure" or prop_name == "vibration":
                            base_value = midpoint + amplitude * math.cos(time_counter * 0.15 + random.uniform(-0.5, 0.5))
                        elif prop_name == "torque" or prop_name == "humidity":
                            base_value = midpoint + amplitude * (0.7 * math.sin(time_counter * 0.08) + 0.3 * math.cos(time_counter * 0.2))

                        # Apply periodic random perturbation
                        perturbation = random_perturbations[f"{line_name}-{machine_name}-{prop_name}"]
                        new_value = base_value + perturbation

                        # Ensure value stays within min/max bounds
                        new_value = max(min_v, min(max_v, new_value))
                        
                        # Round to 2 decimal places for consistency
                        new_value = float(round(new_value, 2))

                        await node.write_value(new_value)
                        updated_props.append(f"{prop_name}: {new_value}")
                    print(
                        f"Updated {machine_name} in {line_name}: {', '.join(updated_props)}")
                print("")

            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(create_opcua_server())
